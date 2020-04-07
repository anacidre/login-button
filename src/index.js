/** @format */

import createAuth0Client from '@auth0/auth0-spa-js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
  #login-button {
   background-color: #EB5424;
   color: var(--color, #FFFFFF);
   font-family: var(--font-family, sans-serif);
   font-size: var(--font-size, 18px);
   line-height: var(--line-height, 32px);
    border-radius: 5px;
    text-transform: uppercase;
    border: 1px solid #EB5424;
    margin: 5px 16px 5px 16px;
    padding: 10px 30px 10px 30px;
    text-decoration-line: none;
  }
  </style>
  <button id="login-button" href="#" part="custom-button">Log in</button>
`;

export default class LoginButtonElement extends HTMLElement {
  constructor() {
    super();

    this._domain = '';
    this._clientid = '';

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  get domain() {
    return this._domain;
  }

  set domain(val) {
    this._domain = val;
    this.setAttribute('domain', val);
    this.buildAuth0Client();
  }

  get clientid() {
    return this._clientid;
  }

  set clientid(val) {
    this._clientid = val;
    this.setAttribute('clientid', val);
    this.buildAuth0Client();
  }

  static get observedAttributes() {
    return ['domain', 'clientid'];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'domain':
          this._domain = newValue;
          break;
        case 'clientid':
          this._clientid = newValue;
          break;
      }
    }
    this.buildAuth0Client();
  }

  async connectedCallback() {
    await this.buildAuth0Client();

    this.addEventListener('click', async (e) => {
      const isAuthenticated = await this.auth0Client.isAuthenticated();

      if (!isAuthenticated) {
        await this.login();
      } else {
        await this.logout();
      }
      await this.updateUI();

      e.preventDefault();
    });

    await this.handleRedirectCallback();
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
    const loginButton = this.shadowRoot.getElementById('login-button');

    if (!isAuthenticated) {
      loginButton.innerText = 'Log in';
    } else {
      loginButton.innerText = 'Log out';
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
