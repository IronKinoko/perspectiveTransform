let points = [
  { x: 100, y: 122 },
  { x: 296, y: 40 },
  { x: 513, y: 262 },
  { x: 273, y: 411 },
]

const inputCanvas = document.getElementById('input')
const outputCanvas = document.getElementById('output')

const image = new Image()
image.src = './demo.png'
image.onload = () => {
  inputCanvas.width = image.width
  inputCanvas.height = image.height
  outputCanvas.width = image.width
  outputCanvas.height = image.height

  init()
}

function init() {
  render()

  points.forEach((point, index) => {
    const el = document.createElement('div')
    el.className = 'drag-point'
    el.style.left = `${point.x}px`
    el.style.top = `${point.y}px`
    el.textContent = index
    el.onmousedown = (e) => {
      const init = points[index]
      const start = { x: e.clientX, y: e.clientY }

      const onMouseMove = (e) => {
        const next = { x: init.x + e.clientX - start.x, y: init.y + e.clientY - start.y }

        points[index] = next
        el.style.left = `${next.x}px`
        el.style.top = `${next.y}px`

        requestAnimationFrame(render)
      }
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    document.querySelector('.editor').appendChild(el)
  })
}

function render() {
  const ctx = inputCanvas.getContext('2d')

  ctx.drawImage(image, 0, 0)

  ctx.beginPath()
  points.forEach((point) => {
    ctx.lineTo(point.x, point.y)
  })
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
  ctx.fill()

  perspectiveTransform(inputCanvas, outputCanvas, points)
}
