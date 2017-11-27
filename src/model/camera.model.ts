export const cameraSchema = {
    name: 'camera',
    fields: [
        {
            name: 'id',
            type: 'integer',
            notNull: true,
            primary: true,
            autoIncrement: true
        },
        {
            name: 'name',
            type: 'text',
            notNull: true
        },
        {
            name: 'description',
            type: 'text',
            notNull: true
        }
    ]
}

export const cameraModel = {
    id: 0,
    name: "",
    description: ""
}