export const ChechPrice = (price: number): number => {
  try {
    // 865570580
    if (
      price.toString().startsWith("86") &&
      price.toString().trim().length >= 9
    ) {
      return 0;
    }
    // 99361298782
    if (
      price.toString().startsWith("993") &&
      price.toString().trim().length >= 11
    ) {
      return 0;
    }
    return price;
  } catch (err) {
    return 0;
  }
};
