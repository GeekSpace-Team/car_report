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
exports.logsService = void 0;
const express_1 = __importDefault(require("express"));
const elasticsearch_connection_1 = __importDefault(require("../database/elasticsearch.connection"));
const logsService = express_1.default.Router();
exports.logsService = logsService;
const index = "report_car";
logsService.get("/all-logs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page } = req.query;
    const size = 20;
    const from = Number(page) * size;
    const result = yield elasticsearch_connection_1.default.search({
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
}));
logsService.get("/get-dashboard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const one = yield elasticsearch_connection_1.default.search({
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
    const two = yield elasticsearch_connection_1.default.search({
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
    const three = yield elasticsearch_connection_1.default.search({
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
    const four = yield elasticsearch_connection_1.default.search({
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
    const five = yield elasticsearch_connection_1.default.search({
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
    const six = yield elasticsearch_connection_1.default.search({
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
    const seven = yield elasticsearch_connection_1.default.search({
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
    const eight = yield elasticsearch_connection_1.default.search({
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
        average_price_over_time: (_a = one.aggregations) === null || _a === void 0 ? void 0 : _a.average_price_over_time,
        brand_price_comparison: (_b = two.aggregations) === null || _b === void 0 ? void 0 : _b.brand_price_comparison,
        model_price_comparison: (_c = three.aggregations) === null || _c === void 0 ? void 0 : _c.model_price_comparison,
        year_price_trends: (_d = four.aggregations) === null || _d === void 0 ? void 0 : _d.year_price_trends,
        daily_upload_trends: (_e = five.aggregations) === null || _e === void 0 ? void 0 : _e.daily_upload_trends,
        price_correlation_year: (_f = six.aggregations) === null || _f === void 0 ? void 0 : _f.price_correlation_year,
        top: seven.hits.hits,
        total: eight.hits.total,
        price_avg: (_g = eight.aggregations) === null || _g === void 0 ? void 0 : _g.price_avg,
        brand_count: (_h = eight.aggregations) === null || _h === void 0 ? void 0 : _h.brand_count,
        model_count: (_j = eight.aggregations) === null || _j === void 0 ? void 0 : _j.model_count,
    });
}));
