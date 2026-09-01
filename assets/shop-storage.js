(function () {
  const STORAGE_KEY = "arianska_selection_test_shop_products";

  const readCustomProducts = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const writeCustomProducts = (products) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  };

  const baseProducts = () => Array.isArray(window.ARIA_SHOP_PRODUCTS) ? window.ARIA_SHOP_PRODUCTS : [];

  const allProducts = () => {
    const products = [...baseProducts()];
    readCustomProducts().forEach((customProduct) => {
      const index = products.findIndex((product) => product.id === customProduct.id);
      if (index >= 0) {
        products[index] = customProduct;
      } else {
        products.push(customProduct);
      }
    });
    return products;
  };

  const saveProduct = (product) => {
    const products = readCustomProducts();
    const index = products.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    writeCustomProducts(products);
    return product;
  };

  const removeProduct = (id) => {
    writeCustomProducts(readCustomProducts().filter((product) => product.id !== id));
  };

  const slugify = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || `produkt-${Date.now()}`;
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  };

  window.ARIA_SHOP_STORAGE = {
    allProducts,
    customProducts: readCustomProducts,
    saveProduct,
    removeProduct,
    slugify,
    fileToDataUrl
  };
})();
