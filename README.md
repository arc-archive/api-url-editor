[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-url-editor.svg)](https://www.npmjs.com/package/@api-components/api-url-editor)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-url-editor)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/api-url-editor)

# api-url-editor

An AMF powered url editor for the HTTP request editor.

It uses `@api-components/api-url-data-model` to transform AMF model to the view model recognized by this element.

```html
<api-url-editor required auto-validate
  base-uri="https://api.domain.com"
  endpoint-path="/users/me"
  query-model="{{queryModel}}"
  path-model="{{pathModel}}"
  value="{{url}}"></api-url-editor>
```

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-url-editor @api-components/api-url-data-model
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-url-data-model/api-url-data-model.js';
      import '@api-components/api-headers-editor/api-headers-editor.js';
    </script>
  </head>
  <body>
    <api-url-data-model></api-url-data-model>
    <api-headers-editor></api-headers-editor>
    <!-- You have to pass data from `api-url-data-model` to `api-headers-editor` -->
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@api-components/api-url-data-model/api-url-data-model.js';
import '@api-components/api-headers-editor/api-headers-editor.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <api-url-data-model
      amf-model="[[amfModel]]"
      api-base-uri="{{baseUri}}"
      endpoint-path="{{endpointPath}}"
      selected="[[selectedShape]]"
      path-model="{{pathModel}}"
      query-model="{{queryModel}}"></api-url-data-model>

    <api-url-editor required auto-validate
      base-uri="[[baseUri]]"
      endpoint-path="[[endpointPath]]"
      query-model="{{queryModel}}"
      path-model="{{pathModel}}"
      value="{{url}}"></api-url-editor>
    `;
  }

  static get properties() {
    return {
      selectedShape: String,
      amfModel: Object
    }
  }

  constructor() {
    super();
    this.selectedShape = 'amf://id11';
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/api-url-editor
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
