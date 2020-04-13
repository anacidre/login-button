/** @format */

import createAuth0Client from '@auth0/auth0-spa-js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
  button {
    background-color: var(--login-button-background, #EB5424);
    color: var(--login-button-color, #FFFFFF);
    font-family: var(--login-button-font-family, sans-serif);
    font-size: var(--login-button-font-size, 18px);
    line-height: var(--login-button-line-height, 32px);
    border-radius: var(--login-button-border-radius, 5px);
    text-transform: uppercase;
    border: var(--login-button-border, 1px solid #EB5424);
    margin: 5px 16px;
    padding: 10px 30px;
    text-decoration-line: none;
  }
  </style>
  <button part="button">Log in</button>
`;

export default class LoginButtonElement extends HTMLElement {
  constructor() {
    super();

    this._domain = '';
    this._clientid = '';

    this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));
		this.clickHandler = this.clickHandler.bind(this);
  }

  get domain() {
    return this._domain;
  }

  set domain(val) {
    this._domain = val;
    this.buildAuth0Client();
  }

  get clientid() {
    return this._clientid;
  }

  set clientid(val) {
    this._clientid = val;
    this.buildAuth0Client();
  }

  static get observedAttributes() {
    return ['domain', 'clientid'];
  }

  async attributeChangedCallback(attr, oldValue, newValue) {
		if (oldValue !== newValue) {
			this[attr] = newValue;
		}
	}

  async connectedCallback() {
    await this.buildAuth0Client();

    this.addEventListener('click', this.clickHandler);

    await this.handleRedirectCallback();
    await this.updateUI();
	}

	async disconnectedCallback() {
		this.removeEventListener('click', this.clickHandler);
	}

	async clickHandler(e) {
		e.preventDefault();
		const isAuthenticated = await this.auth0Client.isAuthenticated();

		if (!isAuthenticated) {
			await this.login();
		} else {
			await this.logout();
		}
		await this.updateUI();
	}

  async buildAuth0Client() {
    this.auth0Client = await createAuth0Client({
      domain: this._domain,
      client_id: this._clientid,
    });
  }

  async updateUI() {
    const isAuthenticated = await this.auth0Client.isAuthenticated();
    this._loginButton = this._loginButton || this.shadowRoot.querySelector('button');

    if (isAuthenticated) {
      this._loginButton.innerText = 'Log out';
    } else {
			this._loginButton.innerText = 'Log in';
    }
  }

  async login() {
    await this.auth0Client.loginWithRedirect({
      redirect_uri: window.location.origin,
    });
  }

  async logout() {
    this.auth0Client.logout({
      returnTo: window.location.origin,
    });
  }

  async handleRedirectCallback() {
    const isAuthenticated = await this.auth0Client.isAuthenticated();

    if (!isAuthenticated) {
      const query = window.location.search;
      if (query.includes('code=') && query.includes('state=')) {
        await this.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, '/');
      }
    }
  }
}

customElements.define('login-button', LoginButtonElement);
