/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, {
	useCallback,
	useRef,
	useEffect,
	type ReactNode,
	type ComponentType,
	useMemo,
	useState
} from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
} from "react-native";

import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import { ImageSource, OrientationsT } from "./@types";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  orientation?: OrientationsT;
  ImageComponent?: ComponentType<{ children: ReactNode; imageSrc: ImageSource; imageIndex: number }>;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("window");
const SCREEN_WIDTH = SCREEN.width;

function ImagesViewer({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => {},
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  orientation = 'PORTRAIT',
  ImageComponent,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource>>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const [headerTransform, footerTransform, toggleBarsVisible] =
    useAnimatedComponents();

  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex]);

  const fullScreenToggle = () => {
	setFullScreen((status) => !status);
  };

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList]
  );

  const {
	SCREEN_WIDTH,
	SCREEN_HEIGHT
	} = useMemo(() => {
		if (orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT') {
			return {
				SCREEN_WIDTH: SCREEN.height,
				SCREEN_HEIGHT: SCREEN.width
			};
		}
		return {
			SCREEN_WIDTH: SCREEN.width,
			SCREEN_HEIGHT: SCREEN.height
		};
	}, [orientation]);

  const {rotate, statusBarTranslucent} = useMemo(() => {
	switch(orientation) {
		case 'LANDSCAPE-LEFT':
			return {
				rotate: '90deg',
				statusBarTranslucent: true
			};
		case 'PORTRAIT-UPSIDEDOWN':
			return {
				rotate: '180deg',
				statusBarTranslucent: false
			};
		case 'LANDSCAPE-RIGHT':
			return {
				rotate: '270deg',
				statusBarTranslucent: true
			};
		default:
			return {
				rotate: '0deg',
				statusBarTranslucent: false
			};
	}
  }, [orientation]);

  const imageRender = useCallback((imageSrc: ImageSource) => <ImageItem
		onZoom={onZoom}
		imageSrc={imageSrc}
		onRequestClose={onRequestCloseEnhanced}
		onLongPress={onLongPress}
		delayLongPress={delayLongPress}
		swipeToCloseEnabled={swipeToCloseEnabled}
		doubleTapToZoomEnabled={doubleTapToZoomEnabled}
		orientation={orientation}
	/>, [delayLongPress, swipeToCloseEnabled, doubleTapToZoomEnabled, orientation])

  if (!visible) {
    return null;
  }
  
  return (
    <Modal
      transparent={presentationStyle === "overFullScreen"}
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait", "landscape-left"]}
	  statusBarTranslucent={statusBarTranslucent}
      hardwareAccelerated
    >
		<StatusBarManager presentationStyle={presentationStyle}/>
      <View style={[styles.container, { opacity, backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
		<View style={{height: SCREEN_HEIGHT, width: SCREEN_WIDTH, transform: [{rotate}]}}>
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (
            React.createElement(HeaderComponent, {
              imageIndex: currentImageIndex,
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
          )}
        </Animated.View>
        <VirtualizedList
          ref={imageList}
          data={images}
          horizontal
          pagingEnabled
          windowSize={2}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={imageIndex}
          getItem={(_: any, index: any) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={(_: any, index: any) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item: imageSrc }: any) => (
			ImageComponent ? React.createElement(ImageComponent, {
				children: imageRender(imageSrc),
				imageSrc,
				imageIndex: currentImageIndex,
			}) : imageRender(imageSrc)
          )}
          onMomentumScrollEnd={onScroll}
          //@ts-ignore
          keyExtractor={(imageSrc, index) =>
            keyExtractor
              ? keyExtractor(imageSrc, index)
              : typeof imageSrc === "number"
              ? `${imageSrc}`
              : imageSrc.uri
          }
        />
        {typeof FooterComponent !== "undefined" && (
          <Animated.View
            style={[styles.footer, { transform: footerTransform }]}
          >
            {React.createElement(FooterComponent, {
              imageIndex: currentImageIndex,
            })}
          </Animated.View>
        )}
		</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    bottom: 0,
  },
});

const EnhancedImagesViewer = (props: Props) => (
  <ImagesViewer key={props.imageIndex} {...props} />
);

export default EnhancedImagesViewer;
