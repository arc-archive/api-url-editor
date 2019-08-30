import { html, render } from 'lit-html';
import { ApiDemoPageBase } from '@advanced-rest-client/arc-demo-helper/ApiDemoPage.js';
import '@api-components/api-navigation/api-navigation.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@api-components/api-url-data-model/api-url-data-model.js';
import '@api-components/raml-aware/raml-aware.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '../api-url-editor.js';

class ApiDemo extends ApiDemoPageBase {
  constructor() {
    super();

    this.initObservableProperties([
      'mainReadOnly', 'mainDisabled', 'demoOutlined', 'demoCompatibility',
      'baseUri', 'endpointPath', 'queryModel', 'pathModel', 'selectedShape',
      'mainNoLabelFloat', 'selectedOverrideBase'
    ]);

    this.componentName = 'api-url-editor';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this._mainDemoStateHandler = this._mainDemoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._baseUrlChangeHandler = this._baseUrlChangeHandler.bind(this);
    this._endpointPathChangeHandler = this._endpointPathChangeHandler.bind(this);
    this._queryModelChangeHandler = this._queryModelChangeHandler.bind(this);
    this._pathModelChangeHandler = this._pathModelChangeHandler.bind(this);
    this._mainValueChanged = this._mainValueChanged.bind(this);
    this._baseUriSelectorHandler = this._baseUriSelectorHandler.bind(this);
  }

  get helper() {
    if (!this.__helper) {
      this.__helper = document.getElementById('helper');
    }
    return this.__helper;
  }

  _navChanged(e) {
    const { selected, type } = e.detail;
    if (type === 'method') {
      this.selectedShape = selected;
    } else {
      this.selectedShape = undefined;
    }
  }

  _mainDemoStateHandler(e) {
    const state = e.detail.value;
    switch (state) {
      case 0:
        this.demoOutlined = false;
        this.demoCompatibility = false;
        break;
      case 1:
        this.demoOutlined = true;
        this.demoCompatibility = false;
        break;
      case 2:
        this.demoOutlined = false;
        this.demoCompatibility = true;
        break;
    }
  }

  _toggleMainOption(e) {
    const { name, checked } = e.target;
    this[name] = checked;
  }

  _baseUrlChangeHandler(e) {
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

  _baseUriSelectorHandler(e) {
    this.selectedOverrideBase = e.detail.value;
  }

  _demoTemplate() {
    const {
      mainReadOnly,
      mainDisabled,
      demoStates,
      darkThemeActive,
      demoOutlined,
      demoCompatibility,
      baseUri,
      selectedOverrideBase,
      endpointPath,
      queryModel,
      pathModel,
      mainNoLabelFloat
    } = this;
    const finalBaseUri = selectedOverrideBase ? selectedOverrideBase : baseUri;
    return html`<section class="documentation-section">
      <h2>API model demo</h2>
      <p>
        This demo lets you preview the API URL editor element with various
        configuration options.
      </p>

      <section role="main" class="horizontal-section-container centered main">
        ${this._apiNavigationTemplate()}
        <div class="demo-container">
          <arc-interactive-demo
            .states="${demoStates}"
            @state-chanegd="${this._mainDemoStateHandler}"
            ?dark="${darkThemeActive}"
          >
            <api-url-editor
              slot="content"
              ?readonly="${mainReadOnly}"
              ?disabled="${mainDisabled}"
              ?outlined="${demoOutlined}"
              ?compatibility="${demoCompatibility}"
              ?noLabelFloat="${mainNoLabelFloat}"
              .baseUri="${finalBaseUri}"
              .endpointPath="${endpointPath}"
              .queryModel="${queryModel}"
              .pathModel="${pathModel}"
              @value-changed="${this._mainValueChanged}"></api-url-editor>

            <label slot="options" id="mainOptionsLabel">Options</label>

            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="mainReadOnly"
              @change="${this._toggleMainOption}"
              >Read only</anypoint-checkbox
            >
            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="mainDisabled"
              @change="${this._toggleMainOption}"
              >Disabled</anypoint-checkbox
            >

            <anypoint-checkbox
              aria-describedby="mainOptionsLabel"
              slot="options"
              name="mainNoLabelFloat"
              @change="${this._toggleMainOption}"
              >No label float</anypoint-checkbox
            >
          </arc-interactive-demo>

          <anypoint-dropdown-menu class="base-uri-selector">
            <label slot="label">Override API's base uri</label>
            <anypoint-listbox
              slot="dropdown-content"
              attrforselected="data-url"
              @selected-changed="${this._baseUriSelectorHandler}">
              <anypoint-item data-url="">Restore API's base URI</anypoint-item>
              <anypoint-item data-url="https://domain.com/base">https://domain.com/base</anypoint-item>
              <anypoint-item
                data-url="https://{version}.domain.com/base/{path}">
                https://{version}.domain.com/base/{path}
              </anypoint-item>
            </anypoint-listbox>
          </anypoint-dropdown-menu>
        </div>
      </section>
    </section>`;
  }

  _render() {
    const {
      selectedShape
    } = this;
    render(html`
      ${this.headerTemplate()}

      <api-url-data-model
        aware="model"
        @apibaseuri-changed="${this._baseUrlChangeHandler}"
        @endpointpath-changed="${this._endpointPathChangeHandler}"
        .selected="${selectedShape}"
        @pathmodel-changed="${this._pathModelChangeHandler}"
        @querymodel-changed="${this._queryModelChangeHandler}"></api-url-data-model>

      ${this._demoTemplate()}
      `, document.querySelector('#demo'));
  }
}
const instance = new ApiDemo();
instance.render();
window.demoInstance = instance;
