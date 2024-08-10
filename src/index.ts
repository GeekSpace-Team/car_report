import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import client from "./database/elasticsearch.connection";
import excelToJson from "convert-excel-to-json";
import path from "path";
import multer from "multer";
import cors from "cors";
import { logsService } from "./modules/logs.service";
import { ChechPrice } from "./core/price-checker";
import brandsService from "./modules/brands.service";
import { Pool } from "pg";
import format from "pg-format";

dotenv.config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "report_db",
  password: process.env.PG_PASSWORD,
  port: 5432,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + " (" + new Date() + ")" + file.originalname
    );
  },
});

const upload = multer({ storage: storage });

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/logos", express.static("logos"));
app.use("/public", express.static("public"));
app.use("/api", logsService);
app.use("/brand", brandsService);
app.get("/create-index", async (req: Request, res: Response) => {
  try {
    await client.indices.create({
      index: "report_car",
    });
    await client.indices.putMapping({
      index: "report_car",
      body: {
        properties: {
          markasy: {
            type: "keyword",
          },
          ady: {
            type: "keyword",
          },
          yyly: {
            type: "integer",
          },
          bahasy: {
            type: "integer",
          },
          color: {
            type: "keyword",
          },
          created_at: {
            type: "date",
          },
          full: {
            type: "text",
          },
        },
      },
    });
    res.json({
      success: true,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err,
    });
  }
});
app.post(
  "/upload",
  upload.single("report"),
  async (req: Request, res: Response) => {
    // const filePath = path.join(__dirname, "public", "otcyot.xlsx");
    const result = excelToJson({
      sourceFile: `${req.file?.path}`,
    });

    let { reportDate } = req.body;

    if (
      typeof reportDate === "undefined" ||
      reportDate == null ||
      reportDate == ""
    ) {
      reportDate = new Date();
    }

    const d = new Date();

    const bulkRequestBody = result.otcot
      .filter((_, index) => index > 0)
      .flatMap((doc) => [
        {
          index: {
            _index: "report_car",
            _id: `${doc.A}_${doc.B}_${doc.C}_${doc.D}_${d.getDay()}_${
              d.getMonth() + 1
            }_${d.getFullYear()}`,
          },
        },
        {
          markasy: doc.A,
          ady: doc.B,
          yyly: doc.C,
          bahasy: ChechPrice(doc.D),
          created_at: doc.F ? getDate(doc.F) : reportDate,
          color: doc.E,
          full: `${doc.A} ${doc.B} ${doc.C} ${doc.D}`,
        },
      ]);

    // renki doc.E
    // senesi doc.F

    try {
      const { errors, items } = await client.bulk({
        refresh: true,
        body: bulkRequestBody,
      });
      if (errors) {
        res.send(errors);
      } else {
        const values = await processDocuments(result, reportDate, d);
        const sql = format(
          `INSERT INTO report_car (markasy,ady,yyly,bahasy,created_at,color,"full", e_id) VALUES %L`,
          values
        );
        await pool.query(sql);
        res.json(values);
      }
    } catch (error) {
      res.send(error);
    }

    // const result = await client.search({});
  }
);

const processDocuments = async (result, reportDate, d) => {
  const values: any[] = [];
  const filtered = result.otcot.filter((_, index) => index > 0);

  await Promise.all(
    filtered.map(async (doc: any, i) => {
      values.push([
        doc.A,
        doc.B,
        doc.C,
        ChechPrice(doc.D),
        doc.F ? getDate(doc.F) : reportDate,
        doc.E,
        `${doc.A} ${doc.B} ${doc.C} ${doc.D}`,
        `${doc.A}_${doc.B}_${doc.C}_${doc.D}_${d.getDay()}_${
          d.getMonth() + 1
        }_${d.getFullYear()}`,
      ]);
    })
  );

  return values;
};

function getDate(dateString: string): Date {
  // console.log(dateString);
  try {
    const dateParts = dateString.split(".");

    // Create a new Date object
    // Note: Months are 0-indexed in JavaScript, so we subtract 1 from the month.
    return new Date(
      Number(dateParts[0]),
      Number(dateParts[1]),
      Number(dateParts[2])
    );
  } catch (err) {
    return new Date();
  }
}

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
