import { useEffect, useState } from "react";
import { getAllCategories } from "../dataStore/category_apis";
import type { CategoryClient } from "../models/category_client";

export default function useCategories() {
  const [categories, setCategories] = useState<CategoryClient[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .finally(() => setCatLoading(false));
  }, []);
  return { categories, catLoading };
}
