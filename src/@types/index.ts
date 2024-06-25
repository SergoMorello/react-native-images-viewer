/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ImageURISource, ImageRequireSource } from "react-native";

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export const Orientations = [
	'PORTRAIT',
	'LANDSCAPE-LEFT',
	'LANDSCAPE-RIGHT',
	'PORTRAIT-UPSIDEDOWN'
] as const;

export type OrientationsT = typeof Orientations[number];

export type ImageSource = ImageURISource | ImageRequireSource;
