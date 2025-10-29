"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNextInquiry = exports.performDeepResearch = void 0;
const geminiServiceCore_js_1 = require("./geminiServiceCore.js");
const resolveEnvValue = (key) => {
    if (typeof process !== 'undefined') {
        return process.env?.[key];
    }
    return undefined;
};
const { performDeepResearch, findNextInquiry } = (0, geminiServiceCore_js_1.createGeminiService)(resolveEnvValue);
exports.performDeepResearch = performDeepResearch;
exports.findNextInquiry = findNextInquiry;
