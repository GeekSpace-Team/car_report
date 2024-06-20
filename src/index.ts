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

dotenv.config();

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
          created_at: new Date(),
          full: `${doc.A} ${doc.B} ${doc.C} ${doc.D}`,
        },
      ]);

    try {
      const { errors, items } = await client.bulk({
        refresh: true,
        body: bulkRequestBody,
      });
      if (errors) {
        console.dir(errors);
      } else {
        console.log(items);
      }
    } catch (error) {
      console.dir(error);
    }

    // const result = await client.search({});
    res.json(result);
  }
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
