import { Cart, CartPagedQueryResponse, ClientResponse } from '@commercetools/platform-sdk';
import flowFactory from '../../app/api-flow/flow-factory';
import UserApi from '../user/userApi';
import store from '../../app/store';

export default class CartApi {
  public static async createCart(): Promise<string> {
    let customerId: string;

    if (localStorage.getItem('token_store')) {
      const customer = await UserApi.getUser();
      customerId = customer.id;
    }

    const response = await flowFactory.clientCredentialsFlow
      .carts()
      .post({
        body: {
          customerId,
          currency: 'USD',
          country: 'US',
        },
      })
      .execute();

    const cartID: string = response.body.id;
    store.setCart(response.body);
    localStorage.setItem('cartID', cartID);
    return cartID;
  }

  public static async addItemToCart(productId: string): Promise<void> {
    const cartID: string = localStorage.getItem('cartID') || (await this.createCart());
    const cartVersion: number = store.cart.version;

    const response = await flowFactory.clientCredentialsFlow
      .carts()
      .withId({ ID: cartID })
      .post({
        body: {
          actions: [
            {
              action: 'addLineItem',
              productId,
            },
          ],
          version: cartVersion,
        },
      })
      .execute();
    store.setCart(response.body);
  }

  public static async deleteCustomerCart(): Promise<ClientResponse<Cart>> {
    const customerId = store.user.id;
    return flowFactory.clientCredentialsFlow
      .carts()
      .withId({ ID: customerId })
      .delete({
        queryArgs: {
          version: 1,
        },
      })
      .execute();
  }

  public static async getCustomerCart(): Promise<ClientResponse<Cart>> {
    const customerId = store.user.id;
    return flowFactory.clientCredentialsFlow.carts().withCustomerId({ customerId }).get().execute();
  }

  public static async getAnonymousCart(): Promise<ClientResponse<Cart>> {
    const cartID = localStorage.getItem('cartID');
    return flowFactory.clientCredentialsFlow.carts().withId({ ID: cartID }).get().execute();
  }

  public static async getAllCarts(): Promise<ClientResponse<CartPagedQueryResponse>> {
    return flowFactory.clientCredentialsFlow
      .carts()
      .get({ queryArgs: { limit: 100 } })
      .execute();
  }

  public static async setCustomerID(customerId: string): Promise<void> {
    const cartID: string = localStorage.getItem('cartID');
    await flowFactory.clientCredentialsFlow
      .carts()
      .withId({ ID: cartID })
      .post({
        body: {
          actions: [
            {
              action: 'setCustomerId',
              customerId,
            },
          ],
          version: store.cart.version,
        },
      })
      .execute();
  }

  public static async addDiscountCode(code: string = 'emp15'): Promise<Cart> {
    const response: ClientResponse<Cart> = await flowFactory.clientCredentialsFlow
      .carts()
      .withId({ ID: store.user.id })
      .post({
        body: {
          actions: [
            {
              action: 'addDiscountCode',
              code,
            },
          ],
          version: store.cart.version,
        },
      })
      .execute();
    store.cart = response.body;
    return response.body;
  }
}
