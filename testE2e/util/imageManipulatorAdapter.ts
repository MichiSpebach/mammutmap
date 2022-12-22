import * as sharp from 'sharp'

export async function extendImageWithGreyMargin(image: string|Buffer, marginInPx: number): Promise<Buffer> {
    // TODO: splitted in two calls because otherwise image would just scale, find better solution
    image = await extendImageWithGreyMarginSpecifyingEachSide(image, marginInPx, 0)
    image = await extendImageWithGreyMarginSpecifyingEachSide(image, 0, marginInPx)
    return image
}

async function extendImageWithGreyMarginSpecifyingEachSide(image: string|Buffer, marginHorizontalInPx: number, marginVerticalInPx: number): Promise<Buffer> {
    const sharpImage = sharp(image)

    const metadata: sharp.Metadata = await sharpImage.metadata()
    if (!metadata.width) {
        throw new Error('metadata.width is undefined')
    }
    if (!metadata.height) {
        throw new Error('metadata.height is undefined')
    }

    return sharpImage.resize({
        fit: 'contain',
        position: 'centre',
        width: metadata.width + marginHorizontalInPx*2,
        height: metadata.height + marginVerticalInPx*2,
        background: {r: 127, g: 127, b: 127}
    }).toBuffer()
}