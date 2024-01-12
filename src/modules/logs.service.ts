import express, { Request, Response } from "express";
import client from "../database/elasticsearch.connection";

const logsService = express.Router();
const index = "report_car";

logsService.get("/all-logs", async (req: Request, res: Response) => {
  const { page } = req.query;
  const size = 20;
  const from = Number(page) * size;
  const result = await client.search({
    index: index,
    track_total_hits: true,
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
  res.json(result);
});

logsService.post("/write-data", async (req: Request, res: Response) => {
  const {
    body,
    name,
    phone,
    type,
    date_own,
    duration,
    status,
    latitude,
    longitude,
  } = req.body;

  const data = await client.index({
    index: "kbana_t_2",
    body: {
      body,
      name,
      phone,
      type,
      date_own,
      duration,
      status,
      latitude,
      longitude,
      created_at: new Date(),
    },
  });
  res.json(data);
});

logsService.post("/write-multiple", async (req: Request, res: Response) => {
  const { data } = req.body;

  const body = data.flatMap((doc: any) => [
    { index: { _index: "kbana_t_2" } },
    {
      name: doc.name,
      phone: doc.phone,
      type: doc.type,
      date_own: doc.date_own,
      duration: doc.duration,
      status: doc.status,
      latitude: doc.latitude,
      longitude: doc.longitude,
      created_at: new Date(),
    },
  ]);

  const result = await client.bulk({ body });

  // Check the result as needed
  console.log(result);
});

logsService.get("/get-dashboard", async (req: Request, res: Response) => {
  const one = await client.search({
    index: index,
    size: 0,
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
        },
      },
    },
  });

  const three = await client.search({
    index: index,
    size: 0,
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
        },
      },
    },
  });

  const four = await client.search({
    index: index,
    size: 0,
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
        },
      },
    },
  });

  const five = await client.search({
    index: index,
    size: 0,
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

export { logsService };
