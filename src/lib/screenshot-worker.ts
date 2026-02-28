/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference lib="webworker" />

self.addEventListener(
  'message',
  (
    e: MessageEvent<{
      buffer: ArrayBuffer;
      height: number;
      pixelRatio: number;
      width: number;
    }>,
  ) => {
    const { buffer, height, pixelRatio, width } = e.data;

    void (async () => {
      try {
        const svgDataUrl = new TextDecoder().decode(new Uint8Array(buffer));

        const response = await fetch(svgDataUrl);
        const svgBlob = await response.blob();
        const bitmap = await createImageBitmap(svgBlob);

        const canvas = new OffscreenCanvas(
          width * pixelRatio,
          height * pixelRatio,
        );
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No 2d context');

        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
        self.postMessage({ blob: pngBlob });
      } catch (error: unknown) {
        self.postMessage({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  },
);
