function perspectiveTransform(canvas1, canvas2, points) {
  if (points.length !== 4) {
    throw new Error('points 参数必须包含 4 个点')
  }

  const ctx1 = canvas1.getContext('2d')
  const ctx2 = canvas2.getContext('2d')

  // 获取原图像数据
  const imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)

  // 目标图上的四个点（填充到 canvas2 的四个角）
  const targetPoints = [
    { x: 0, y: 0 }, // 左上角
    { x: canvas2.width, y: 0 }, // 右上角
    { x: canvas2.width, y: canvas2.height }, // 右下角
    { x: 0, y: canvas2.height }, // 左下角
  ]

  // 计算透视变换矩阵
  const matrix = calculatePerspectiveMatrix(points, targetPoints)

  // 应用透视变换
  applyPerspectiveTransform(ctx2, imgData, matrix, canvas2.width, canvas2.height)
}

// 计算透视变换矩阵
function calculatePerspectiveMatrix(srcPoints, dstPoints) {
  const A = []
  const b = []

  for (let i = 0; i < 4; i++) {
    const sx = srcPoints[i].x
    const sy = srcPoints[i].y
    const dx = dstPoints[i].x
    const dy = dstPoints[i].y

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx])
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy])
    b.push(dx)
    b.push(dy)
  }

  // 求解线性方程组 Ax = b
  const h = solveLinearSystem(A, b)

  // 构造 3x3 透视变换矩阵
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ]
}

// 解线性方程组 Ax = b 的函数
function solveLinearSystem(A, b) {
  const n = A.length
  const augmentedMatrix = A.map((row, i) => [...row, b[i]])

  // 高斯消元法
  for (let i = 0; i < n; i++) {
    // 找到主元
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
        maxRow = k
      }
    }
    // 交换行
    ;[augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]]

    // 归一化主元行
    const pivot = augmentedMatrix[i][i]
    for (let j = i; j <= n; j++) {
      augmentedMatrix[i][j] /= pivot
    }

    // 消去其他行的当前列
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmentedMatrix[k][i]
        for (let j = i; j <= n; j++) {
          augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j]
        }
      }
    }
  }

  // 提取解
  return augmentedMatrix.map((row) => row[n])
}

// 应用透视变换
function applyPerspectiveTransform(ctx, imgData, matrix, width, height) {
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imgData.width
  srcCanvas.height = imgData.height
  const srcCtx = srcCanvas.getContext('2d')
  srcCtx.putImageData(imgData, 0, 0)

  const src = srcCtx.getImageData(0, 0, imgData.width, imgData.height)
  const dst = ctx.createImageData(width, height)

  const inverseMatrix = invertMatrix(matrix)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy, sw] = multiplyMatrixAndPoint(inverseMatrix, [x, y, 1])
      const srcX = Math.round(sx / sw)
      const srcY = Math.round(sy / sw)

      if (srcX >= 0 && srcX < src.width && srcY >= 0 && srcY < src.height) {
        const srcIndex = (srcY * src.width + srcX) * 4
        const dstIndex = (y * width + x) * 4

        dst.data[dstIndex] = src.data[srcIndex]
        dst.data[dstIndex + 1] = src.data[srcIndex + 1]
        dst.data[dstIndex + 2] = src.data[srcIndex + 2]
        dst.data[dstIndex + 3] = src.data[srcIndex + 3]
      }
    }
  }

  ctx.putImageData(dst, 0, 0)
}

// 矩阵点乘
function multiplyMatrixAndPoint(matrix, point) {
  const [x, y, z] = point
  const result = [
    matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
    matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
    matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
  ]
  return result
}

// 矩阵求逆
function invertMatrix(matrix) {
  const m = matrix.flat()
  const inv = []
  const det =
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])

  if (!det) throw new Error('矩阵不可逆')

  const invDet = 1 / det

  inv[0] = (m[4] * m[8] - m[5] * m[7]) * invDet
  inv[1] = (m[2] * m[7] - m[1] * m[8]) * invDet
  inv[2] = (m[1] * m[5] - m[2] * m[4]) * invDet
  inv[3] = (m[5] * m[6] - m[3] * m[8]) * invDet
  inv[4] = (m[0] * m[8] - m[2] * m[6]) * invDet
  inv[5] = (m[2] * m[3] - m[0] * m[5]) * invDet
  inv[6] = (m[3] * m[7] - m[4] * m[6]) * invDet
  inv[7] = (m[1] * m[6] - m[0] * m[7]) * invDet
  inv[8] = (m[0] * m[4] - m[1] * m[3]) * invDet

  return [
    [inv[0], inv[1], inv[2]],
    [inv[3], inv[4], inv[5]],
    [inv[6], inv[7], inv[8]],
  ]
}
