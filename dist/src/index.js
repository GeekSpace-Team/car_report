"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const elasticsearch_connection_1 = __importDefault(require("./database/elasticsearch.connection"));
const convert_excel_to_json_1 = __importDefault(require("convert-excel-to-json"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const logs_service_1 = require("./modules/logs.service");
dotenv_1.default.config();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + " (" + new Date() + ")" + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use("/public", express_1.default.static("public"));
app.use("/api", logs_service_1.logsService);
app.get("/create-index", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield elasticsearch_connection_1.default.indices.create({
            index: "report_car",
        });
        yield elasticsearch_connection_1.default.indices.putMapping({
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
    }
    catch (err) {
        res.json({
            success: false,
            error: err,
        });
    }
}));
app.post("/upload", upload.single("report"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // const filePath = path.join(__dirname, "public", "otcyot.xlsx");
    const result = (0, convert_excel_to_json_1.default)({
        sourceFile: `${(_a = req.file) === null || _a === void 0 ? void 0 : _a.path}`,
    });
    const d = new Date();
    const bulkRequestBody = result.otcot.flatMap((doc) => [
        {
            index: {
                _index: "report_car",
                _type: "_doc",
                _id: `${doc.A}_${doc.B}_${doc.C}_${doc.D}_${d.getDay()}_${d.getMonth() + 1}_${d.getFullYear()}`,
            },
        },
        {
            markasy: doc.A,
            ady: doc.B,
            yyly: doc.C,
            bahasy: doc.D,
            created_at: new Date(),
            full: `${doc.A} ${doc.B} ${doc.C} ${doc.D}`,
        },
    ]);
    try {
        const { errors, items } = yield elasticsearch_connection_1.default.bulk({
            refresh: true,
            body: bulkRequestBody,
        });
        if (errors) {
            console.error(errors);
        }
        else {
            console.log(items);
        }
    }
    catch (error) {
        console.error(error);
    }
    // const result = await client.search({});
    res.json(result);
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
