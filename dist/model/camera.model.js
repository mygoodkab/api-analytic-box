"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cameraSchema = {
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
};
exports.cameraModel = {
    id: 0,
    name: "",
    description: ""
};
//# sourceMappingURL=camera.model.js.map