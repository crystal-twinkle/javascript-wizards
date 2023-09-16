import { ProductProjection } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product';
import { Price } from '@commercetools/platform-sdk';
import CommonBuilderWrapper from '../../shared/lib/common-builder-wrapper';
import ElementBuilder from '../../shared/lib/element-builder';
import Button from '../../shared/ui/button/button';
import { ButtonIconPosition, ButtonSize, ButtonType } from '../../shared/ui/button/models';
import './product-list-card.scss';
import appRouter from '../../shared/lib/router/router';
import { Page } from '../../shared/lib/router/pages';
import CartApi from '../../entities/cart/cart-api';
import store from '../../app/store';
import getPrice from '../../shared/lib/getPrice';

export default class ProductListCard extends CommonBuilderWrapper {
  private price: Price;
  private infoButtons: ElementBuilder;
  private toCartButton: Button;

  constructor(private data: ProductProjection) {
    super();
    this.price = this.data.masterVariant.prices[0];
    this.builder = new ElementBuilder({
      tag: 'div',
      styleClass: 'product-list-card',
    });

    const img = new ElementBuilder({
      tag: 'img',
      styleClass: 'product-list-card__img',
      tagSettings: {
        src: data.masterVariant.images?.[0]?.url,
        alt: 'Product image',
      },
    });
    const priceContainer = new ElementBuilder({
      tag: 'div',
      styleClass: 'product-view__price-container',
    });
    const price = new ElementBuilder({
      tag: 'div',
      styleClass: 'cart-list-card__price',
      content: `${getPrice(this.price)}`,
    });
    priceContainer.append([price.getElement()]);
    const description = new ElementBuilder({
      tag: 'span',
      styleClass: 'product-list-card__description',
      content: data.name?.['en-US'],
    });
    if (this.price.discounted) {
      const descountedPrice = new ElementBuilder({
        tag: 'div',
        styleClass: 'product-view__price',
        content: `${getPrice(this.price, true)}`,
      });

      priceContainer.prepend([descountedPrice.getElement()]);
      descountedPrice.setStyleClass('product-list-card__price product-view__price_discounted');
      price.setStyleClass('product-list-card__price product-view__price_cross-out');
    }
    const likeButton = new Button({
      type: ButtonType.CIRCLE_WITHOUT_BORDER,
      size: ButtonSize.SMALL,
      icon: {
        name: 'heart',
        position: ButtonIconPosition.LEFT,
      },
    });
    this.toCartButton = new Button({
      callback: async () => {
        await CartApi.addItemToCart(this.data.id);
        this.toCartButton.getElement().classList.add('button_disabled');
        this.setButtons();
      },
      type: ButtonType.CIRCLE_WITHOUT_BORDER,
      size: ButtonSize.SMALL,
      icon: {
        name: 'cart',
        position: ButtonIconPosition.LEFT,
      },
    });

    const detailsButton = new Button({
      type: ButtonType.DEFAULT,
      text: 'Details',
      callback: () => appRouter.navigate(`${Page.PRODUCTS}/${data.id}`),
    });
    detailsButton.getElement().classList.add('product-list-card__details-button');
    const info = new ElementBuilder({
      tag: 'div',
      styleClass: 'product-list-card__row',
    });
    this.infoButtons = new ElementBuilder({
      tag: 'div',
    });
    const details = new ElementBuilder({
      tag: 'div',
      styleClass: 'product-list-card__row',
    });

    this.infoButtons.append([likeButton.getElement(), this.toCartButton.getElement()]);
    info.append([this.infoButtons.getElement(), priceContainer.getElement()]);
    details.append([detailsButton.getElement()]);
    this.builder.prepend([description.getElement()]);
    this.builder.append([img.getElement(), info.getElement(), details.getElement()]);
    this.setButtons();
  }

  private setButtons(): void {
    if (!localStorage.getItem('cartID') || !store.cart.lineItems.find((item) => item.productId === this.data.id)) {
      this.toCartButton.getElement().classList.remove('button_disabled');
    } else {
      this.toCartButton.getElement().classList.add('button_disabled');
    }
  }
}
