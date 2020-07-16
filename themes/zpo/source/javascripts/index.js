window.addEventListener('load', function () {
  // loading
  const loading = document.getElementById('loading-wrapper')
  console.log(loading)
  let timer = setTimeout(() => {
    loading.classList.add('animate-fade-out')
    loading.addEventListener('animationend', () => {
      loading.classList.add('hidden')
      clearTimeout(timer)
    })
  }, 500)
})