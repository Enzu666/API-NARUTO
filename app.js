'use strict'

const API_BASE = 'https://dattebayo-api.onrender.com'

let todosPersonagens = []
let favoritos = JSON.parse(localStorage.getItem('naruto-favoritos') || '[]')
let paginaAtual = 'todos'

async function init() {
    await carregarPersonagens()
    preencherSelectVilas()
    atualizarBadge()
}

async function carregarPersonagens() {
    const grid = document.getElementById('grid-todos')
    grid.innerHTML = '<div class="loading">Carregando personagens...</div>'

    try {
        let pagina = 1
        let totalPaginas = 1

        while (pagina <= totalPaginas) {
            const res = await fetch(`${API_BASE}/characters?page=${pagina}&limit=20`)
            const data = await res.json()

            todosPersonagens = [...todosPersonagens, ...data.characters]
            totalPaginas = data.totalPages || 1
            pagina++
        }

        renderizarCards(todosPersonagens)
    } catch (err) {
        grid.innerHTML = '<div class="vazio">Erro ao carregar personagens. Tente novamente.</div>'
        console.error(err)
    }
}


function renderizarCards(lista) {
    const grid = document.getElementById('grid-todos')
    const contagem = document.getElementById('contagem-todos')

    contagem.textContent = `${lista.length} personagens encontrados`

    if (lista.length === 0) {
        grid.innerHTML = '<div class="vazio">Nenhum personagem encontrado.</div>'
        return
    }

    grid.innerHTML = ''
    lista.forEach(p => grid.appendChild(criarCard(p)))
}

function renderizarFavoritos() {
    const grid = document.getElementById('grid-favoritos')
    const contagem = document.getElementById('contagem-favoritos')

    const lista = todosPersonagens.filter(p => favoritos.includes(p.id))
    contagem.textContent = `${lista.length} personagens encontrados`

    if (lista.length === 0) {
        grid.innerHTML = '<div class="vazio">Você ainda não tem favoritos. ♡</div>'
        return
    }

    grid.innerHTML = ''
    lista.forEach(p => grid.appendChild(criarCard(p)))
}

function criarCard(personagem) {
    const card = document.createElement('div')
    card.className = 'card'

    const isFavorito = favoritos.includes(personagem.id)

    const imgWrapper = document.createElement('div')
    imgWrapper.className = 'card-img-wrapper'

    const imagens = personagem.images || []
    if (imagens.length > 0) {
        const img = document.createElement('img')
        img.src = imagens[0]
        img.alt = personagem.name
        img.loading = 'lazy'
        img.onerror = () => {
            imgWrapper.innerHTML = '<div class="img-placeholder">🥷</div>'
        }
        imgWrapper.appendChild(img)
    } else {
        imgWrapper.innerHTML = '<div class="img-placeholder">🥷</div>'
    }

    const btnFav = document.createElement('button')
    btnFav.className = `btn-favorito ${isFavorito ? 'ativo' : ''}`
    btnFav.innerHTML = isFavorito ? '🧡' : '🤍'
    btnFav.title = isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
    btnFav.onclick = () => toggleFavorito(personagem.id, btnFav)
    imgWrapper.appendChild(btnFav)

    const body = document.createElement('div')
    body.className = 'card-body'

    const nome = document.createElement('h3')
    nome.className = 'card-nome'
    nome.textContent = personagem.name

    const tags = document.createElement('div')
    tags.className = 'tags'

    const clan = personagem.personal?.clan
    if (clan) {
        const tag = document.createElement('span')
        tag.className = 'tag tag-clan'
        tag.textContent = Array.isArray(clan) ? clan[0] : clan
        tags.appendChild(tag)
    }

    const vilas = personagem.personal?.affiliation
    if (vilas) {
        const vilaArr = Array.isArray(vilas) ? vilas : [vilas]
        vilaArr.slice(0, 2).forEach(v => {
            const tag = document.createElement('span')
            tag.className = 'tag tag-vila'
            tag.textContent = v
            tags.appendChild(tag)
        })
    }

    const rank = personagem.rank?.ninjaRank
    if (rank) {
        const rankVal = typeof rank === 'object' ? Object.values(rank)[0] : rank
        if (rankVal) {
            const tag = document.createElement('span')
            tag.className = 'tag tag-rank'
            tag.textContent = rankVal
            tags.appendChild(tag)
        }
    }

    const status = document.createElement('p')
    status.className = 'card-status'
    const statusVal = personagem.personal?.status || 'Unknown'
    status.textContent = `Status: ${Array.isArray(statusVal) ? statusVal[0] : statusVal}`

    const detalhes = document.createElement('a')
    detalhes.className = 'card-detalhes'
    detalhes.href = '#'
    detalhes.innerHTML = '👁️ Ver detalhes'
    detalhes.onclick = (e) => { e.preventDefault(); abrirModal(personagem) }

    body.appendChild(nome)
    body.appendChild(tags)
    body.appendChild(status)
    body.appendChild(detalhes)

    card.appendChild(imgWrapper)
    card.appendChild(body)

    return card
}

function toggleFavorito(id, btn) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(f => f !== id)
        btn.innerHTML = '🤍'
        btn.classList.remove('ativo')
    } else {
        favoritos.push(id)
        btn.innerHTML = '🧡'
        btn.classList.add('ativo')
    }

    localStorage.setItem('naruto-favoritos', JSON.stringify(favoritos))
    atualizarBadge()

    if (paginaAtual === 'favoritos') renderizarFavoritos()
}

function atualizarBadge() {
    const badge = document.getElementById('badge-favoritos')
    badge.textContent = favoritos.length
    badge.style.display = favoritos.length > 0 ? 'flex' : 'none'

    const navFav = document.getElementById('nav-favoritos')
    const icon = navFav.querySelector('.nav-icon')
    icon.textContent = favoritos.length > 0 ? '🧡' : '🤍'
}

function mostrarTodos(e) {
    e.preventDefault()
    paginaAtual = 'todos'
    document.getElementById('secao-todos').style.display = 'block'
    document.getElementById('secao-favoritos').style.display = 'none'
    document.getElementById('hero').style.display = 'flex'
    document.getElementById('nav-todos').classList.add('active')
    document.getElementById('nav-favoritos').classList.remove('active')
}

function mostrarFavoritos(e) {
    e.preventDefault()
    paginaAtual = 'favoritos'
    document.getElementById('secao-todos').style.display = 'none'
    document.getElementById('secao-favoritos').style.display = 'block'
    document.getElementById('hero').style.display = 'none'
    document.getElementById('nav-todos').classList.remove('active')
    document.getElementById('nav-favoritos').classList.add('active')
    renderizarFavoritos()
}

function preencherSelectVilas() {
    const select = document.getElementById('select-vila')
    const vilas = new Set()

    todosPersonagens.forEach(p => {
        const af = p.personal?.affiliation
        if (af) {
            const arr = Array.isArray(af) ? af : [af]
            arr.forEach(v => vilas.add(v))
        }
    })

    Array.from(vilas).sort().forEach(v => {
        const opt = document.createElement('option')
        opt.value = v
        opt.textContent = v
        select.appendChild(opt)
    })
}

function filtrar() {
    const busca = document.getElementById('input-busca').value.toLowerCase()
    const vila = document.getElementById('select-vila').value
    const status = document.getElementById('select-status').value

    const filtrados = todosPersonagens.filter(p => {
        const nome = p.name?.toLowerCase() || ''
        const afiliacao = p.personal?.affiliation
        const afiliacaoArr = afiliacao ? (Array.isArray(afiliacao) ? afiliacao : [afiliacao]) : []
        const statusVal = p.personal?.status
        const statusStr = Array.isArray(statusVal) ? statusVal[0] : statusVal || ''

        const matchNome = nome.includes(busca)
        const matchVila = vila === '' || afiliacaoArr.includes(vila)
        const matchStatus = status === '' || statusStr === status

        return matchNome && matchVila && matchStatus
    })

    renderizarCards(filtrados)
}

function scrollParaBusca() {
    document.getElementById('busca-section').scrollIntoView({ behavior: 'smooth' })
}

function abrirModal(p) {
    document.getElementById('modal-nome').textContent = p.name

    const img = document.getElementById('modal-img')
    img.src = p.images?.[0] || ''
    img.alt = p.name

    const val = (v) => Array.isArray(v) ? v.join(', ') : (v || '—')

    document.getElementById('modal-sexo').textContent = val(p.personal?.sex)
    document.getElementById('modal-nascimento').textContent = val(p.personal?.birthdate)
    document.getElementById('modal-status').textContent = val(p.personal?.status)
    document.getElementById('modal-cla').textContent = val(p.personal?.clan)
    document.getElementById('modal-vila').textContent = val(p.personal?.affiliation)

    const rankEl = document.getElementById('modal-rank')
    rankEl.innerHTML = ''
    const rank = p.rank?.ninjaRank
    if (rank) {
        const entries = typeof rank === 'object' ? Object.entries(rank) : [['', rank]]
        entries.forEach(([parte, valor]) => {
            const tag = document.createElement('span')
            tag.className = 'tag tag-rank'
            tag.textContent = parte ? `${parte}: ${valor}` : valor
            rankEl.appendChild(tag)
        })
    } else {
        rankEl.textContent = '—'
    }

    document.getElementById('modal-manga').textContent = val(p.debut?.manga)
    document.getElementById('modal-anime').textContent = val(p.debut?.anime)

    document.getElementById('modal-overlay').classList.add('aberto')
    document.body.style.overflow = 'hidden'
}

function fecharModalBtn() {
    document.getElementById('modal-overlay').classList.remove('aberto')
    document.body.style.overflow = ''
}

function fecharModal(e) {
    if (e.target === document.getElementById('modal-overlay')) fecharModalBtn()
}

init()