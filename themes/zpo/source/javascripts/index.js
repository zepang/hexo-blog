window.onload = () => {
  // loading
  const loading = document.getElementById('loading-wrapper')
  let timer = setTimeout(() => {
    loading.classList.add('animate-fade-out')
    loading.addEventListener('animationend', () => {
      loading.classList.add('hidden')
    })
  }, 500)
}