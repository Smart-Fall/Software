/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as caregiverPatients from "../caregiverPatients.js";
import type * as caregivers from "../caregivers.js";
import type * as deviceStatus from "../deviceStatus.js";
import type * as devices from "../devices.js";
import type * as falls from "../falls.js";
import type * as healthLogs from "../healthLogs.js";
import type * as patients from "../patients.js";
import type * as sensorData from "../sensorData.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  caregiverPatients: typeof caregiverPatients;
  caregivers: typeof caregivers;
  deviceStatus: typeof deviceStatus;
  devices: typeof devices;
  falls: typeof falls;
  healthLogs: typeof healthLogs;
  patients: typeof patients;
  sensorData: typeof sensorData;
  sessions: typeof sessions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
