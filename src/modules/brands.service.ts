import express from "express";
import { brands } from "../data/brand.data";

const brandsService = express.Router();

export const findBrand = (name: string): string | undefined => {
  return brands.find((it) =>
    name.toLowerCase().trim().includes(it.name.toLowerCase())
  )?.image.optimized;
};

brandsService.get("/get-brands", (req, res) => {
  res.json(brands);
});

export default brandsService;
