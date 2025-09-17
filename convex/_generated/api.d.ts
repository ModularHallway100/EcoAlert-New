/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_alerts from "../api/alerts.js";
import type * as api_community from "../api/community.js";
import type * as api_educational from "../api/educational.js";
import type * as api_environmental from "../api/environmental.js";
import type * as api_sensors from "../api/sensors.js";
import type * as api_users from "../api/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "api/alerts": typeof api_alerts;
  "api/community": typeof api_community;
  "api/educational": typeof api_educational;
  "api/environmental": typeof api_environmental;
  "api/sensors": typeof api_sensors;
  "api/users": typeof api_users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
