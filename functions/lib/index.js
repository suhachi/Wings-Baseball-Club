"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// Export callables
__exportStar(require("./callables/members"), exports);
__exportStar(require("./callables/notices"), exports);
__exportStar(require("./callables/tokens"), exports);
__exportStar(require("./callables/events"), exports); // μATOM-0531: createEventPost
__exportStar(require("./callables/comments.moderation"), exports); // C03-04: Comment Moderation
// Export scheduled functions
// Export scheduled functions
// Export triggers
__exportStar(require("./triggers/comments.commentCount"), exports); // C03-05: Comment Count Trigger
