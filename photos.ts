// this is just a list of generated items so I can reference them

export const photos = {
  'photo-1762842842525': {
    filename: 'photos/photo.png',
    PREFIX: 'photo-1762842842525',
    X_STEPS: 15,
    Y_STEPS: 15,
  },
  // 照片会在上传后自动添加到这里
}

export type Photo = typeof photos[keyof typeof photos];
