var searchData = []

function createSearchItem (item) {
  var itemWrapper = document.createElement('a')
  var itemTitle = document.createElement('h4')
  var itemContent = document.createElement('p')
  itemWrapper.classList.add('search-item')
  itemTitle.classList.add('search-item-title')
  itemContent.classList.add('search-item-content')
  itemTitle.innerHTML = item.matchTitle
  itemContent.innerHTML = item.matchContent
  itemWrapper.href = item.url
  itemWrapper.appendChild(itemTitle)
  itemWrapper.appendChild(itemContent)
  return itemWrapper
}

function createSearchResultDom () {
  var searchResult = document.querySelector('#search-local .search-box .search-result')
  var searchResultFragment = document.createDocumentFragment()
  searchData.forEach(item => {
    if (item.isMatch) {
      var itemDom = createSearchItem(item)
      searchResultFragment.appendChild(itemDom)
    }
  })
  searchResult.innerHTML = ''
  searchResult.appendChild(searchResultFragment)
}

function filterSearchResult (keyword) {
  searchData.forEach(item => {
    var title = item.title.trim().toLowerCase()
    var content = item.content ? 
      item.content.trim().replace(/<[^>]+>/g, "").toLowerCase() : ''
    var titleIndex = title.indexOf(keyword)
    var contentIndex = content.indexOf(keyword)
    if ( titleIndex === -1 && contentIndex === -1) {
      item.isMatch = false
    } else {
      var regS = new RegExp(keyword, "gi")
      item.isMatch = true
      item.matchTitle = title.replace(regS, "<em class=\"search-keyword\">" + keyword + "</em>")
      if (contentIndex > 0) {
        item.matchContent = content.slice(contentIndex - 20 > 0 ? contentIndex - 20 : contentIndex, contentIndex + keyword.length + 100)
        item.matchContent = item.matchContent.replace(regS,  "<em class=\"search-keyword\">" + keyword + "</em>")
      } else {
        item.matchContent = content.slice(0, 120)
      }
    }
  })
}

function initSearchData () {
  searchData.forEach(item => {
      var title = item.title.trim().toLowerCase()
      var content = item.content ? 
        item.content.trim().replace(/<[^>]+>/g, "").toLowerCase() : ''
      item.isMatch = true
      item.matchTitle = title
      item.matchContent = content.slice(0, 120)
  })
}

function initSeachDomListener () {
  var searchLocalBtn = document.getElementById('search-local-btn')
  var searchLocal = document.getElementById('search-local')
  var searchInput = searchLocal.querySelector('.search-input')

  searchLocalBtn.addEventListener('click', function (e) {
    searchLocal.style.display = 'block'
  })
  searchLocal.addEventListener('click', function (e) {
    if (e.target === this) {
      this.style.display = 'none'
      searchInput.value = ''
      initSearchData()
      createSearchResultDom()
    }
  })
  searchInput.addEventListener('input', function (e) {
    if (!e.target.value || !e.target.value.trim) {
      initSearchData
    } else {
      filterSearchResult(e.target.value)
    }
    createSearchResultDom()
  })
}

function getSearchData () {
  var http = new XMLHttpRequest()
  http.open('GET', '/search.json')
  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      if (http.status === 200) {
        searchData = JSON.parse(http.responseText)
        initSeachDomListener()
        initSearchData()
        createSearchResultDom()
      }
    }
  }
  http.send()
}

window.onload = function () {
  getSearchData()
}