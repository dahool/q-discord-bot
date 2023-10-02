export enum Colors {
    Gray = '#C0C0C0',
    Black = '#000000',
    White = '#FFFFFF',
    NavyBlue = '#000080',
    Cyan = '#00FFFF',
    Blue = '#0000FF',
    Red = '#FF0000',
    Salmon = '#FA8072',
    HotPink = '#FF1493',
    Green = '#008000',
    Lime = '#00FF00',
    Violet = '#EE82EE',
    Purple = '#800080',
    Yellow = '#FFFF00'
}

export function randomizeColor(): string {
    const enumValues = Object.keys(Colors) as Array<keyof Colors>; 
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    const randomEnumKey = enumValues[randomIndex];
    // @ts-ignore
    return Colors[randomEnumKey];
}