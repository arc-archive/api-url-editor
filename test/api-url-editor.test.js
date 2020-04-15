import {
  fixture,
  assert,
  nextFrame,
  html
} from '@open-wc/testing';
import '../api-url-editor.js';
import * as sinon from 'sinon/pkg/sinon-esm.js';

describe('<api-url-editor>', function() {
  async function basicFixture() {
    return (await fixture(`<api-url-editor></api-url-editor>`));
  }

  async function requiredFixture() {
    return (await fixture(`<api-url-editor required></api-url-editor>`));
  }

  async function eventsFixture() {
    return (await fixture(`<api-url-editor baseuri="https://domain.com" endpointpath="/{path}"></api-url-editor>`));
  }

  async function valueFixture() {
    return (await fixture(`<api-url-editor value="https://domain.com/api/path"></api-url-editor>`));
  }

  async function invalidFixture() {
    return (await fixture(`<api-url-editor value="https://domain.com/{path}" invalid></api-url-editor>`));
  }

  const BASE_URI = 'https://{base}.domain.com';

  describe('Basic computations', () => {
    let element;
    const TEST_PATH = '/test/{path}/value/{param}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      await nextFrame();
    });

    it('Computes _fullUrl', () => {
      assert.equal(element._fullUri, BASE_URI + TEST_PATH);
    });

    it('_urlParams is computed', () => {
      assert.typeOf(element._urlParams, 'array');
      assert.lengthOf(element._urlParams, 3);
    });

    it('_urlParams contains all path parameters', () => {
      assert.equal(element._urlParams[0], 'base');
      assert.equal(element._urlParams[1], 'path');
      assert.equal(element._urlParams[2], 'param');
    });

    it('_urlSearchRegexp is computed', () => {
      assert.ok(element._urlSearchRegexp);
    });
  });

  describe('Array values', () => {
    let element;
    let querylModel;
    const TEST_PATH = '/path/{var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      querylModel = [{
        value: 'test',
        name: 'test',
        required: true,
        schema: {}
      }, {
        value: ['test'],
        name: 'arrayParameter',
        required: true,
        schema: {}
      }];
    });

    it('Produces URL with single array value', () => {
      element.queryModel = querylModel;
      const match = element.value.match(/&arrayParameter=/g);
      assert.equal(match.length, 1);
    });

    it('Element produces URL with array values', () => {
      querylModel[1].value.push('test2');
      element.queryModel = querylModel;
      const match = element.value.match(/&arrayParameter=/g);
      assert.equal(match.length, 2);
    });
  });

  describe('Dispatches events', () => {
    let element;
    let querylModel;
    const TEST_PATH = '/path/{var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      querylModel = [{
        value: 'test',
        name: 'value',
        required: true,
        schema: {}
      }];
    });

    it('Dispatches url-value-changed custom event', () => {
      const spy = sinon.stub();
      element.addEventListener('url-value-changed', spy);
      element.value = BASE_URI;
      assert.isTrue(spy.calledOnce);
    });

    it('Dispatches url-value-changed event when query parameter change', () => {
      const spy = sinon.stub();
      element.addEventListener('url-value-changed', spy);
      element.queryModel = querylModel;
      assert.isTrue(spy.calledOnce);
    });

    it('Event contains declared properties', (done) => {
      element.addEventListener('url-value-changed', (e) => {
        assert.equal(e.detail.value, 'https://{base}.domain.com/path/{var}?value=test');
        done();
      });
      element.queryModel = querylModel;
    });
  });

  describe('Handles events', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    function fire(url) {
      document.body.dispatchEvent(new CustomEvent('url-value-changed', {
        bubbles: true,
        detail: {
          value: url
        }
      }));
    }

    it('Updates value from the event', () => {
      const url = 'https://domain.com/';
      fire(url);
      assert.equal(element.value, url);
    });

    it('Does not redispatch the event', () => {
      const url = 'https://domain.com/path';
      const spy = sinon.stub();
      element.addEventListener('url-value-changed', spy);
      fire(url);
      assert.isFalse(spy.called);
    });
  });

  describe('URL templates', () => {
    let element;
    let pathlModel;
    const TEST_PATH = '/path/{+var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      pathlModel = {
        value: '/test and extra!',
        name: '+var',
        required: true,
        schema: {}
      };
    });

    it('Processes URL template with plus sign', () => {
      const item = Object.assign({}, pathlModel);
      item.value = 'test';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path/test');
    });

    it('Encodes special characters', () => {
      const item = Object.assign({}, pathlModel);
      item.value = 'test and extra';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path/test%20and%20extra');
    });

    it('Does not encode reserved characters', () => {
      const item = Object.assign({}, pathlModel);
      item.value = '/test and extra!';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path//test%20and%20extra!');
    });

    it('Does not encode if noAutoEncode is enabled', () => {
      const item = Object.assign({}, pathlModel);
      item.noAutoEncode = true;
      item.name = 'base';
      item.value = '/test and extra!';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https:///test and extra!.domain.com/path/{+var}');
    })
  });

  describe('_computeUrlParams()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns null when no argument', () => {
      const result = element._computeUrlParams();
      assert.equal(result, null);
    });

    it('Retuns parameter names', () => {
      const result = element._computeUrlParams('/{paramA}/{paramB}');
      assert.deepEqual(result, ['paramA', 'paramB']);
    });

    it('Retuns null when no parameters', () => {
      const result = element._computeUrlParams('/paramA/paramB');
      assert.equal(result, null);
    });
  });

  describe('fire()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    const eventName = 'test-event';
    const eventDetail = { type: 'test-detail' };

    it('Dispatches the event', () => {
      const spy = sinon.spy();
      element.addEventListener(eventName, spy);
      element.fire(eventName, eventDetail);
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element.fire(eventName, eventDetail);
      assert.typeOf(e, 'customevent');
      assert.equal(e.type, eventName);
    });

    it('Event has detail', () => {
      const e = element.fire(eventName, eventDetail);
      assert.deepEqual(e.detail, eventDetail);
    });

    it('Event is cancelable', () => {
      const e = element.fire(eventName, eventDetail);
      assert.isFalse(e.cancelable);
    });

    it('Event bubbles', () => {
      const e = element.fire(eventName, eventDetail);
      assert.isTrue(e.bubbles);
    });
  });

  describe('_computeUrlRegexp()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns null when no argument', () => {
      const result = element._computeUrlRegexp();
      assert.equal(result, null);
    });

    it('Returns RegExp', () => {
      const result = element._computeUrlRegexp('https://domain.com/api');
      assert.typeOf(result, 'regexp');
    });

    it('Escapes special caracters', () => {
      const result = element._computeUrlRegexp('https://domain.com/api');
      assert.equal(result.source, 'https:\\/\\/domain\\.com\\/api.*');
    });

    it('Escapes variables', () => {
      const result = element._computeUrlRegexp('/{paramA}/paramB');
      assert.equal(result.source, '\\/([a-zA-Z0-9\\$\\-_\\.~\\+!\'\\(\\)\\*\\{\\}]+)\\/paramB.*');
    });
  });

  describe('_onElementBlur()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls validate()', () => {
      const spy = sinon.spy(element, 'validate');
      element._onElementBlur();
      assert.isTrue(spy.called);
    });
  });

  describe('_findModelIndex()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns -1 when no model', () => {
      const result = element._findModelIndex('query', 'test');
      assert.equal(result, -1);
    });

    it('Returns index in model', () => {
      element.queryModel = [{ name: 't1' }, { name: 't2' }];
      const result = element._findModelIndex('t2', 'query');
      assert.equal(result, 1);
    });

    it('Returns -1 when item do not exists', () => {
      element.queryModel = [{ name: 't1' }, { name: 't2' }];
      const result = element._findModelIndex('t3', 'query');
      assert.equal(result, -1);
    });
  });

  describe('_applyQueryParamsValues()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when no argument', () => {
      element._applyQueryParamsValues();
      assert.isUndefined(element.queryModel);
    });

    it('Updates query model values', () => {
      element.queryModel = [{ name: 't1' }, { name: 't2' }];
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.equal(element.queryModel[0].value, 'test1');
      assert.equal(element.queryModel[1].value, 'test2');
    });

    it('updates value when updating the model', () => {
      element.queryModel = [{ name: 't1' }, { name: 't2' }];
      const spy = sinon.spy(element, '_computeValue');
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.isTrue(spy.called);
    });

    it('ignores value update when parameters did not change', () => {
      element.queryModel = [{ name: 't1', value: 'test1' }, { name: 't2', value: 'test2' }];
      const spy = sinon.spy(element, '_computeValue');
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.isFalse(spy.called);
    });

    it('Ignores non-existin items', () => {
      element.queryModel = [{ name: 't1' }, { name: 't2' }];
      element._applyQueryParamsValues({
        t0: 'test1',
        t2: 'test2'
      });
      assert.isUndefined(element.queryModel[0].value);
      assert.equal(element.queryModel[1].value, 'test2');
    });
  });

  describe('_applyUriValues()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when empty arguments ', () => {
      element._applyUriValues([], []);
      assert.isUndefined(element.pathModel);
    });

    it('Updates query model values', () => {
      element.pathModel = [{ name: 't1' }, { name: 't2' }];
      element._applyUriValues(['test1', 'test2'], ['t1', 't2']);
      assert.equal(element.pathModel[0].value, 'test1');
      assert.equal(element.pathModel[1].value, 'test2');
    });

    it('Ignores non-existin items', () => {
      element.pathModel = [{ name: 't1' }, { name: 't2' }];
      element._applyUriValues(['test1', 'test2'], ['t0', 't2']);
      assert.isUndefined(element.pathModel[0].value);
      assert.equal(element.pathModel[1].value, 'test2');
    });
  });

  describe('_applyQueryParamToObject()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothin when no param argument', () => {
      const obj = {};
      element._applyQueryParamToObject(undefined, obj);
      assert.lengthOf(Object.keys(obj), 0);
    });

    it('Does nothin when no obj argument', () => {
      element._applyQueryParamToObject('a=b');
      // for test coverage, also, no error
    });

    it('Does nothin when no param is not a string', () => {
      const obj = {};
      element._applyQueryParamToObject(false, obj);
      assert.lengthOf(Object.keys(obj), 0);
    });

    it('Adds parameter to the object', () => {
      const obj = {};
      element._applyQueryParamToObject('a=b', obj);
      assert.lengthOf(Object.keys(obj), 1);
      assert.equal(obj.a, 'b');
    });

    it('Creates array value', () => {
      const obj = {
        a: 'b'
      };
      element._applyQueryParamToObject('a=c', obj);
      assert.deepEqual(obj.a, ['b', 'c']);
    });

    it('Appends to existin array', () => {
      const obj = {
        a: ['b', 'd']
      };
      element._applyQueryParamToObject('a=c', obj);
      assert.deepEqual(obj.a, ['b', 'd', 'c']);
    });
  });

  describe('_computeFullUrl()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('return default string', () => {
      const result = element._computeFullUrl();
      assert.equal(result, '/');
    });

    it('Adds slash to the beginning', () => {
      const result = element._computeFullUrl(null, 'test');
      assert.equal(result, '/test');
    });

    it('Creates full URL', () => {
      const result = element._computeFullUrl('https://domain.com', 'test');
      assert.equal(result, 'https://domain.com/test');
    });

    it('Removed trailing slash', () => {
      const result = element._computeFullUrl('https://domain.com/', 'test');
      assert.equal(result, 'https://domain.com/test');
    });
  });

  describe('_getValidity()', () => {
    describe('Not required field', () => {
      let input;
      beforeEach(async () => {
        input = await basicFixture();
      });

      it('Valid when not required end empty value', () => {
        input.value = '';
        const result = input._getValidity();
        assert.isTrue(result);
      });

      it('Valid when value is undefined', () => {
        input.value = undefined;
        const result = input._getValidity();
        assert.isTrue(result);
      });

      it('Invalid for variables', () => {
        input.value = '{test}';
        const result = input._getValidity();
        assert.isFalse(result);
      });

      // Demo page marks this as invalid, test doesn't
      // not sure why is that...
      it('Invalid for invalid URL value', async () => {
        input.value = 'some value not URL';
        await nextFrame();
        const result = input._getValidity();
        assert.isFalse(result);
      });
    });

    describe('Required field', () => {
      let input;
      beforeEach(async () => {
        input = await requiredFixture();
      });

      it('Invalid when empty value', async () => {
        input.value = '';
        await nextFrame();
        const result = input._getValidity();
        assert.isFalse(result);
      });

      it('Valid when value is undefined', () => {
        input.value = undefined;
        const result = input._getValidity();
        assert.isTrue(result);
      });
    });
  });

  describe('Auto validation', () => {
    let input;
    beforeEach(async () => {
      input = await basicFixture();
    });

    it('Valid for valid value', async () => {
      input.value = 'https://domain.com?a=b&param=value#1232344';
      await nextFrame();
      assert.isFalse(input.invalid);
    });

    it('Invalid for variables', async () => {
      input.value = 'https://domain.com?{a}=b&param=value#1232344';
      await nextFrame();
      assert.isTrue(input.invalid);
    });

    // Demo page marks this as invalid, test doesn't
    // not sure why is that...
    it.skip('Invalid when chanding value back to empty stirng', async () => {
      input.value = 'https://domain.com';
      await nextFrame();
      assert.isFalse(input.invalid, 'initially valied');
      input.value = '';
      await nextFrame();
      assert.isTrue(input.invalid, 'invalid after the change');
    });

    it.skip('Invalid for invalid URL value', async () => {
      input.value = 'some value not URL';
      await nextFrame();
      assert.isTrue(input.invalid);
    });
  });

  describe('Validation with query events', () => {
    let element;
    const invalidUrl = 'https://domain.com/{path}/?{param}=value';
    const uriModel = {
      name: 'path',
      required: true,
      type: 'string'
    };
    const queryModel = {
      description: '',
      name: 'param',
      required: true,
      type: 'string'
    };

    beforeEach(async () => {
      element = await eventsFixture();
      element.queryModel = [Object.assign({}, queryModel)];
      element.pathModel = [Object.assign({}, uriModel)];
      element.value = invalidUrl;
    });

    it('Invalid by default', function() {
      const valid = element.validate();
      assert.isFalse(valid);
    });

    it('Valid after uri param update', async () => {
      element.pathModel[0].value = 'test';
      element.pathModel = [...element.pathModel];
      const valid = element.validate();
      assert.isTrue(valid);
    });
  });

  describe('onvalue', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onvalue);
      const f = () => {};
      element.onvalue = f;
      assert.isTrue(element.onvalue === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onvalue = f;
      element.value = 'test';
      element.onvalue = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onvalue = f1;
      element.onvalue = f2;
      element.value = 'test';
      element.onvalue = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('updating uri model', () => {
    const base = 'https://{host}:{port}/{version}';
    const endpoint = '/api/path/{+id}?a=b';
    let pathModel;
    let element;
    let target;
    beforeEach(async () => {
      element = await basicFixture();
      pathModel = [{
        name: 'host',
        required: true,
        type: 'string',
        value: ''
      }, {
        name: 'port',
        required: true,
        type: 'number',
        value: ''
      }, {
        name: 'version',
        required: true,
        type: 'string',
        value: ''
      }, {
        name: '+id',
        required: true,
        type: 'string',
        value: ''
      }];
      element.pathModel = pathModel;
      element.baseUri = base;
      element.endpointPath = endpoint;
      element.value = base + endpoint;
      await nextFrame();
      target = element.inputElement;
    });

    it('updates value for host part', async () => {
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[0].value, 'api');
      assert.equal(pathModel[1].value, '');
      assert.equal(pathModel[2].value, '');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for port part', async () => {
      const url = base.replace('{port}', '8080');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[1].value, '8080');
      assert.equal(pathModel[2].value, '');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for version part', async () => {
      const url = base.replace('{version}', 'v1');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[2].value, 'v1');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for +id part', async () => {
      const url = endpoint.replace('{+id}', '1234567');
      target.value = base + url;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[3].value, '1234567');
    });

    it('replaces path model with equal items', () => {
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.isFalse(pathModel === element.pathModel);
      assert.deepEqual(pathModel, element.pathModel);
    });

    it('ignores model change when no new parameters', () => {
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(pathModel === element.pathModel);
    });

    it('ignores model change when valu is the same', () => {
      element.pathModel[0].value = 'api';
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(pathModel === element.pathModel);
    });
  });

  describe('updating query model', () => {
    const base = 'https://api.domain.com';
    const endpoint = '/api?page=&limit=';
    let queryModel;
    let element;
    let target;
    beforeEach(async () => {
      element = await basicFixture();
      queryModel = [{
        name: 'page',
        required: true,
        type: 'number',
        value: ''
      }, {
        name: 'limit',
        required: true,
        type: 'number',
        value: ''
      }];
      element.queryModel = queryModel;
      element.baseUri = base;
      element.endpointPath = endpoint;
      element.value = base + endpoint;
      await nextFrame();
      target = element.inputElement;
    });

    it('updates value for page part', async () => {
      target.value = base + '/api?page=12&limit';
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(queryModel[0].value, '12');
      assert.equal(queryModel[1].value, '');
    });

    it('updates value for limit part', async () => {
      target.value = base + '/api?page=&limit=100';
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(queryModel[0].value, '');
      assert.equal(queryModel[1].value, '100');
    });

    it('replaces path model with equal items', () => {
      target.value = base + '/api?page=12&limit';
      target.dispatchEvent(new CustomEvent('input'));
      assert.isFalse(queryModel === element.queryModel);
      assert.deepEqual(queryModel, element.queryModel);
    });

    it('ignores model change when no new parameters', () => {
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(queryModel === element.queryModel);
    });
  });

  describe('events API', () => {
    async function basicFixture() {
      const base = 'https://{c}.domain.com';
      const endpoint = '/api';
      const queryModel = [{
        name: 'a',
        value: 'b',
        required: true,
        schema: { enabled: true }
      }];
      const pathModel = [{
        name: 'c',
        value: 'd',
        required: true,
        schema: { enabled: true }
      }];
      const value = base + endpoint;
      return await fixture(html`
        <api-url-editor
        .queryModel="${queryModel}"
        .pathModel="${pathModel}"
        .endpointPath="${endpoint}"
        .value="${value}"></api-url-editor>
      `);
    }

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('updates path model value from uri-parameter-changed event', () => {
      document.body.dispatchEvent( new CustomEvent('uri-parameter-changed', {
        detail: { name: 'c', value: 'updated' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.equal(element.pathModel[0].value, 'updated');
    });

    it('adds unknown path parameters', () => {
      document.body.dispatchEvent( new CustomEvent('uri-parameter-changed', {
        detail: { name: 'e', value: 'new' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.lengthOf(element.pathModel, 2, 'has 2 model items');
      assert.equal(element.pathModel[1].name, 'e', 'has new name');
      assert.equal(element.pathModel[1].value, 'new', 'has new value');
    });

    it('updates query model value from query-parameter-changed event', () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'a', value: 'updated' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.equal(element.queryModel[0].value, 'updated');
    });

    it('adds unknown query parameters', () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'e', value: 'new' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.lengthOf(element.queryModel, 2, 'has 2 model items');
      assert.equal(element.queryModel[1].name, 'e', 'has new name');
      assert.equal(element.queryModel[1].value, 'new', 'has new value');
    });

    it('ignores the event when isCustom is set', () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'e', value: 'new', isCustom: true },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.lengthOf(element.queryModel, 1, 'has 1 model item');
    });

    it('ignores adding an item when removed is set', () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'e', removed: true },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.lengthOf(element.queryModel, 1, 'has 1 model item');
    });

    it('ignores updating an item when value is set', () => {
      const spy = sinon.spy();
      element.addEventListener('pathmodel-changed', spy);
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'a', value: 'b' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.isFalse(spy.called);
    });

    it('removes an item when removed is set', () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'a', removed: true },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.lengthOf(element.queryModel, 0, 'has no items');
    });
  });

  describe('_wwwFormUrlEncodePiece()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty string when no input', () => {
      const result = element._wwwFormUrlEncodePiece();
      assert.equal(result, '');
    });

    it('normalizes spaces to %20', () => {
      const result = element._wwwFormUrlEncodePiece('test value');
      assert.equal(result, 'test%20value');
    });

    it('normalizes spaces to + with replacePlus', () => {
      const result = element._wwwFormUrlEncodePiece('test value', true);
      assert.equal(result, 'test+value');
    });
  });

  describe('_wwwFormUrlEncode()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty string when no input', () => {
      const result = element._wwwFormUrlEncode();
      assert.equal(result, '');
    });

    it('returns normalized query string values', () => {
      const params = [{
        name: 'test key',
        value: 'test value'
      }];
      const result = element._wwwFormUrlEncode(params);
      assert.equal(result, 'test+key=test+value');
    });

    it('concatenates params', () => {
      const params = [{
        name: 'test key',
        value: 'test value'
      }, {
        name: 'a',
        value: 'b c'
      }];
      const result = element._wwwFormUrlEncode(params);
      assert.equal(result, 'test+key=test+value&a=b+c');
    });
  });

  describe('Parts encoding', () => {
    async function basicFixture() {
      const base = 'https://{c}.domain.com';
      const endpoint = '/api';
      const queryModel = [{
        name: 'a',
        value: 'b',
        required: true,
        schema: { enabled: true }
      }];
      const pathModel = [{
        name: 'c',
        value: 'd',
        required: true,
        schema: { enabled: true }
      }];
      const value = base + endpoint;
      return await fixture(html`
        <api-url-editor
        .queryModel="${queryModel}"
        .pathModel="${pathModel}"
        .endpointPath="${endpoint}"
        .baseUri="${base}"
        .value="${value}"></api-url-editor>
      `);
    }

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('encodes path values with %20', async () => {
      document.body.dispatchEvent( new CustomEvent('uri-parameter-changed', {
        detail: { name: 'c', value: 'test value' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.equal(element.value, 'https://test%20value.domain.com/api?a=b');
    });

    it('encodes query values with +', async () => {
      document.body.dispatchEvent( new CustomEvent('query-parameter-changed', {
        detail: { name: 'a', value: 'test value' },
        cancelable: true,
        bubbles: true,
        composed: true
      }));
      assert.equal(element.value, 'https://d.domain.com/api?a=test+value');
    });
  });

  describe('compatibility mode', () => {
    it('sets compatibility on item when setting legacy', async () => {
      const element = await basicFixture();
      element.legacy = true;
      assert.isTrue(element.legacy, 'legacy is set');
      assert.isTrue(element.compatibility, 'compatibility is set');
    });

    it('returns compatibility value from item when getting legacy', async () => {
      const element = await basicFixture();
      element.compatibility = true;
      assert.isTrue(element.legacy, 'legacy is set');
    });
  });

  describe('a11y', () => {
    it('is accessible without a value', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });

    it('is accessible with a value', async () => {
      const element = await valueFixture();
      await assert.isAccessible(element);
    });

    it('is accessible when invalid', async () => {
      const element = await invalidFixture();
      await assert.isAccessible(element);
    });
  });
});
