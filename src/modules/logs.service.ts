import express, { Request, Response } from "express";
import client from "../database/elasticsearch.connection";
import { findBrand } from "./brands.service";

const logsService = express.Router();
const index = "report_car";

logsService.get("/all-logs", async (req: Request, res: Response) => {
  const {
    page,
    start_date,
    end_date,
    brand,
    text,
    min_year,
    max_year,
    color,
    place,
    start_price,
    end_price,
  } = req.query;
  const size = 20;
  const from = Number(page) * size;
  const must: any[] = [];

  if (start_date && end_date) {
    must.push({
      range: {
        created_at: {
          gte: start_date,
          lte: end_date,
        },
      },
    });
  }

  if (start_price && end_price) {
    must.push({
      range: {
        bahasy: {
          gte: start_price,
          lte: end_price,
        },
      },
    });
  }

  if (brand) {
    must.push({
      match: {
        markasy: brand,
      },
    });
  }

  if (min_year && max_year) {
    must.push({
      range: {
        yyly: {
          gte: min_year,
          lte: max_year,
        },
      },
    });
  }

  if (text) {
    must.push({
      match: {
        full: {
          query: text,
          fuzziness: "AUTO",
        },
      },
    });
  }

  let query: any =
    must.length > 0
      ? {
          query: {
            bool: {
              must: must,
            },
          },
        }
      : {};

  console.dir(JSON.stringify(query));

  let result = await client.search({
    index: index,
    track_total_hits: true,
    ...query,
    from: from,
    size: size,
    sort: [
      {
        created_at: {
          order: "desc",
        },
      },
    ],
  });
  let pageCount = 0;
  try {
    pageCount = Math.ceil(Number(result!.hits!.total!["value"]) / size);
  } catch (err) {}
  result = {
    ...result,
    hits: {
      hits: result.hits.hits.map((it) => {
        return {
          ...it,
          _source: {
            ...it._source!,
            image: findBrand(it._source!["markasy"]),
          },
        };
      }),
    },
  };
  res.json({
    ...result,
    pageCount: pageCount,
  });
});

logsService.get("/get-dashboard", async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;
  const must: any[] = [];

  if (start_date && end_date) {
    must.push({
      range: {
        created_at: {
          gte: start_date,
          lte: end_date,
        },
      },
    });
  }

  let query: any =
    must.length > 0
      ? {
          query: {
            bool: {
              must: must,
            },
          },
        }
      : {};

  const one = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      average_price_over_time: {
        date_histogram: {
          field: "created_at",
          calendar_interval: "day",
        },
        aggs: {
          average_price: {
            avg: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });
  const two = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      brand_price_comparison: {
        terms: {
          field: "markasy",
          size: 1000,
        },
        aggs: {
          avg_price: {
            avg: {
              field: "bahasy",
            },
          },
          min_price: {
            min: {
              field: "bahasy",
            },
          },
          max_price: {
            max: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });

  const three = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      model_price_comparison: {
        terms: {
          field: "ady",
          size: 1000,
        },
        aggs: {
          avg_price: {
            avg: {
              field: "bahasy",
            },
          },
          min_price: {
            min: {
              field: "bahasy",
            },
          },
          max_price: {
            max: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });

  const four = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      year_price_trends: {
        terms: {
          field: "yyly",
          size: 1000,
        },
        aggs: {
          avg_price: {
            avg: {
              field: "bahasy",
            },
          },
          min_price: {
            min: {
              field: "bahasy",
            },
          },
          max_price: {
            max: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });

  const five = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      daily_upload_trends: {
        date_histogram: {
          field: "created_at",
          calendar_interval: "day",
        },
        aggs: {
          daily_upload_count: {
            value_count: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });

  const six = await client.search({
    index: index,
    size: 0,
    ...query,
    aggs: {
      price_correlation_year: {
        terms: {
          field: "yyly",
        },
        aggs: {
          price_and_year: {
            avg: {
              field: "bahasy",
            },
          },
        },
      },
    },
  });

  const seven = await client.search({
    index: index,
    size: 10,
    ...query,
    sort: [
      {
        bahasy: {
          order: "desc",
        },
      },
    ],
  });

  const eight = await client.search({
    index: index,
    size: 0,
    ...query,
    track_total_hits: true,
    aggs: {
      price_avg: {
        avg: {
          field: "bahasy",
          missing: 10,
        },
      },
      brand_count: {
        cardinality: {
          field: "markasy",
          precision_threshold: 100,
        },
      },
      model_count: {
        cardinality: {
          field: "ady",
          precision_threshold: 100,
        },
      },
    },
  });

  res.json({
    average_price_over_time: one.aggregations?.average_price_over_time,
    brand_price_comparison: two.aggregations?.brand_price_comparison,
    model_price_comparison: three.aggregations?.model_price_comparison,
    year_price_trends: four.aggregations?.year_price_trends,
    daily_upload_trends: five.aggregations?.daily_upload_trends,
    price_correlation_year: six.aggregations?.price_correlation_year,
    top: seven.hits.hits,
    total: eight.hits.total,
    price_avg: eight.aggregations?.price_avg,
    brand_count: eight.aggregations?.brand_count,
    model_count: eight.aggregations?.model_count,
  });
});

logsService.get("/get-cars", async (req, res) => {
  const {
    start_date,
    end_date,
    brand,
    text,
    min_year,
    max_year,
    color,
    place,
    start_price,
    end_price,
  } = req.query;
  const must: any[] = [];

  if (start_date && end_date) {
    must.push({
      range: {
        created_at: {
          gte: start_date,
          lte: end_date,
        },
      },
    });
  }

  if (start_price && end_price) {
    must.push({
      range: {
        bahasy: {
          gte: start_price,
          lte: end_price,
        },
      },
    });
  }

  if (brand) {
    must.push({
      match: {
        markasy: brand,
      },
    });
  }

  if (min_year && max_year) {
    must.push({
      range: {
        yyly: {
          gte: min_year,
          lte: max_year,
        },
      },
    });
  }

  if (text) {
    must.push({
      match: {
        full: {
          query: text,
          fuzziness: "AUTO",
        },
      },
    });
  }

  let query: any =
    must.length > 0
      ? {
          query: {
            bool: {
              must: must,
            },
          },
        }
      : {};

  console.dir(JSON.stringify(query));

  const result = await client.search({
    size: 0,
    ...query,
    aggs: {
      cars: {
        terms: {
          field: "markasy",
          size: 100000,
        },
        aggs: {
          min_price: {
            min: {
              field: "bahasy",
            },
          },
          max_price: {
            max: {
              field: "bahasy",
            },
          },
          avg_price: {
            avg: {
              field: "bahasy",
            },
          },
          min_year: {
            min: {
              field: "yyly",
            },
          },
          max_year: {
            max: {
              field: "yyly",
            },
          },
          avg_year: {
            avg: {
              field: "yyly",
            },
          },
          last_addedd: {
            max: {
              field: "created_at",
            },
          },
        },
      },
    },
  });
  let cars = result!.aggregations!["cars"]["buckets"];
  cars = cars.map((it: any) => {
    return {
      ...it,
      image: findBrand(it.key),
    };
  });
  res.json(cars);
});

export { logsService };
