import { html } from 'lit-html';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@api-components/api-url-data-model/api-url-data-model.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@api-components/api-server-selector/api-server-selector.js';
import '../api-url-editor.js';

class ApiDemo extends ApiDemoPage {
  constructor() {
    super();

    this.initObservableProperties([
      'readonly', 'disabled', 'outlined', 'compatibility',
      'baseUri', 'endpointPath', 'queryModel', 'pathModel', 'selectedShape',
      'mainNoLabelFloat', 'serverValue', 'serverType',
      'allowCustomBaseUri'
    ]);

    this.componentName = 'api-url-editor';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.serverValue = null;
    this.serverType = null;
    this.allowCustomBaseUri = false;
    this.readonly = false;
    this.disabled = false;
    this.mainNoLabelFloat = false;

    this._mainDemoStateHandler = this._mainDemoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._baseUrlChangeHandler = this._baseUrlChangeHandler.bind(this);
    this._endpointPathChangeHandler = this._endpointPathChangeHandler.bind(this);
    this._queryModelChangeHandler = this._queryModelChangeHandler.bind(this);
    this._pathModelChangeHandler = this._pathModelChangeHandler.bind(this);
    this._mainValueChanged = this._mainValueChanged.bind(this);
    this._serverCountHandler = this._serverCountHandler.bind(this);
    this._serverHandler = this._serverHandler.bind(this);
  }

  get dataModelBaseUri() {
    const { serverValue, serverType } = this;
    if (serverType === 'custom') {
      return serverValue;
    }
    return null;
  }

  get server() {
    const { selectedShape: methodId, selectedEndpointId: endpointId, serverValue, serverType } = this;
    if (serverType !== 'server') {
      console.log('Not a "server" server', serverType);
      return null;
    }
    const servers = this._getServers({ endpointId, methodId });
    const server = servers.find((server) => this._getServerUri(server) === serverValue);
    console.log('Found server:', server);
    return server;
  }

  /**
   * @param {Object} server Server definition.
   * @return {String|undefined} Value for server's base URI
   */
  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return this._getValue(server, key);
  }

  _navChanged(e) {
    const { selected, type, endpointId } = e.detail;
    if (type === 'method') {
      this.selectedShape = selected;
      this.selectedEndpointId = endpointId;
    } else {
      this.selectedShape = undefined;
      this.selectedEndpointId = undefined;
    }
  }

  _mainDemoStateHandler(e) {
    const state = e.detail.value;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
  }

  _baseUrlChangeHandler(e) {
    console.log('Base URI changed', e.detail.value);
    this.baseUri = e.detail.value;
  }

  _endpointPathChangeHandler(e) {
    this.endpointPath = e.detail.value;
  }

  _queryModelChangeHandler(e) {
    this.queryModel = e.detail.value;
  }

  _pathModelChangeHandler(e) {
    this.pathModel = e.detail.value;
  }

  _mainValueChanged(e) {
    console.log('Demo URL value', e.detail.value);
  }

  /**
   * Handler for the `serverscountchanged` dispatched from the server selector.
   * @param {CustomEvent} e
   */
  _serverCountHandler(e) {
    const { value } = e.detail;
    this.serversCount = value;
  }

  /**
   * Handler for the `apiserverchanged` dispatched from the server selector.
   * @param {CustomEvent} e
   */
  _serverHandler(e) {
    const { value, type } = e.detail;
    this.serverType = type;
    this.serverValue = value;
    console.log('Server changed: ', type, value);
  }

  _apiListTemplate() {
    return [
      ['multi-server', 'Multiple servers'],
      ['demo-api', 'Demo API'],
    ].map(([file, label]) => html`
      <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
      <anypoint-item data-src="${file}.json">${label}</anypoint-item>
      `);
  }

  _demoTemplate() {
    const {
      readonly,
      disabled,
      demoStates,
      darkThemeActive,
      outlined,
      compatibility,
      baseUri,
      endpointPath,
      queryModel,
      pathModel,
      mainNoLabelFloat,
      amf,
    } = this;
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the API URL editor element with various
        configuration options.
      </p>

      ${this._serverSelectorTemplate()}

      <arc-interactive-demo
        .states="${demoStates}"
        @state-chanegd="${this._mainDemoStateHandler}"
        ?dark="${darkThemeActive}"
      >
        <api-url-editor
          slot="content"
          @value-changed="${this._mainValueChanged}"
          ?readonly="${readonly}"
          ?disabled="${disabled}"
          ?outlined="${outlined}"
          ?compatibility="${compatibility}"
          ?noLabelFloat="${mainNoLabelFloat}"
          required
          .amf="${amf}"
          .baseUri="${baseUri}"
          .endpointPath="${endpointPath}"
          .queryModel="${queryModel}"
          .pathModel="${pathModel}"
        ></api-url-editor>

        <label slot="options" id="mainOptionsLabel">Options</label>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="readonly"
          @change="${this._toggleMainOption}"
          >Read only</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="disabled"
          @change="${this._toggleMainOption}"
        >Disabled</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="mainNoLabelFloat"
          @change="${this._toggleMainOption}"
        >No label float</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustomBaseUri"
          @change="${this._toggleMainOption}"
        >Allow server custom URI</anypoint-checkbox>
      </arc-interactive-demo>

    </section>`;
  }

  /**
   * @return {object} A template for the server selector
   */
  _serverSelectorTemplate() {
    const {
      amf,
      serverType,
      serverValue,
      allowCustomBaseUri,
      outlined,
      compatibility,
    } = this;
    return html`
    <api-server-selector
      ?allowCustom="${allowCustomBaseUri}"
      .amf="${amf}"
      .value="${serverValue}"
      .type="${serverType}"
      autoselect
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      @serverscountchanged="${this._serverCountHandler}"
      @apiserverchanged="${this._serverHandler}"
    ></api-server-selector>`;
  }

  contentTemplate() {
    const { selectedShape, server, amf, dataModelBaseUri } = this;
    return html`
      <api-url-data-model
        @apibaseuri-changed="${this._baseUrlChangeHandler}"
        @endpointpath-changed="${this._endpointPathChangeHandler}"
        @pathmodel-changed="${this._pathModelChangeHandler}"
        @querymodel-changed="${this._queryModelChangeHandler}"
        .amf="${amf}"
        .apiUri="${dataModelBaseUri}"
        .selected="${selectedShape}"
        .server="${server}"
      ></api-url-data-model>

      <h2 class="centered main">API URL editor</h2>
      ${this._demoTemplate()}
      `;
  }
}
const instance = new ApiDemo();
instance.render();
