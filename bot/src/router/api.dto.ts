
export interface EventDto {
    guild: string,
    zone: string,
    title: string,
    next: Date,
    recurrent: Boolean,
    duration: Number
}

export interface PlayerInfoFilter {
    tag: string,
    name: string,
    version: string
}