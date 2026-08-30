import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'

import { JSDOM } from 'jsdom'
import jpeg from 'jpeg-js'
import MarkdownIt from 'markdown-it'

const root = realpathSync('.')
const generator = 'scripts/readme-cover.html'
const covers = [
  '.github/assets/avatar-cover-dark-en.jpg',
  '.github/assets/avatar-cover-light-en.jpg',
  '.github/assets/avatar-cover-dark-zh-Hans.jpg',
  '.github/assets/avatar-cover-light-zh-Hans.jpg'
]
const coverSet = new Set(covers)
const contractSet = new Set([generator, ...covers])
const scriptDigest = 'ec2194277b73b7795cc1b96411939c1c2518125bfcd996df39fc0c9fd926d52a'
const markdown = new MarkdownIt({ html: true })
const fail = message => { throw new Error(`Invalid README cover assets: ${message}`) }
const hash = value => createHash('sha256').update(value).digest('hex')

const pathAtRoot = path => {
  if (!path || path.includes('\0') || path.startsWith('/') || path.split('/').includes('..')) fail(`unsafe path ${path}`)
  const absolute = resolve(root, path)
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) fail(`path escapes repository: ${path}`)
  return absolute
}

const regular644 = path => {
  const entry = lstatSync(pathAtRoot(path))
  if (!entry.isFile() || entry.isSymbolicLink() || (entry.mode & 0o777) !== 0o644) fail(`${path} must be a regular non-executable 100644 file`)
}

const changedPaths = () => {
  const { BASE_SHA: base, HEAD_SHA: head } = process.env
  if (!/^[0-9a-f]{40}$/iu.test(base ?? '') || !/^[0-9a-f]{40}$/iu.test(head ?? '')) fail('BASE_SHA and HEAD_SHA must be commit SHA-1 values')
  const fields = execFileSync('git', ['diff', '--name-status', '--no-renames', '-z', base, head], { encoding: 'buffer' }).toString('utf8').split('\0').filter(Boolean)
  if (!fields.length || fields.length % 2) fail('expected a non-empty name-status diff')
  const paths = []
  for (let index = 0; index < fields.length; index += 2) {
    const [status, path] = [fields[index], fields[index + 1]]
    if (!/^[AM]$/u.test(status)) fail(`unsupported changed entry ${status} ${path}`)
    paths.push(path)
  }
  const contractChanges = paths.filter(path => contractSet.has(path))
  if (contractChanges.length && (contractChanges.length !== contractSet.size || ![...contractSet].every(path => contractChanges.includes(path)))) {
    fail('a generator or cover change must include the generator and all four covers in the same A/M diff')
  }
  return paths
}

const exactAttributes = (element, expected) => {
  const actual = [...element.attributes].map(attribute => [attribute.name.toLowerCase(), attribute.value]).sort(([a], [b]) => a.localeCompare(b))
  const wanted = Object.entries(expected).sort(([a], [b]) => a.localeCompare(b))
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(`unexpected attributes on <${element.tagName.toLowerCase()}>`)
}

const validateSvg = path => {
  regular644(path)
  const source = readFileSync(pathAtRoot(path), 'utf8')
  if (/<!\s*(?:doctype|entity)\b|<\?\s*xml-stylesheet\b/iu.test(source)) fail(`unsafe SVG declaration in ${path}`)
  const document = new JSDOM(source, { contentType: 'image/svg+xml' }).window.document
  if (document.documentElement?.localName !== 'svg' || document.querySelector('parsererror')) fail(`invalid SVG input ${path}`)
  for (const element of document.querySelectorAll('*')) {
    const tag = element.localName.toLowerCase()
    if (['script', 'foreignobject', 'iframe', 'object', 'embed', 'style'].includes(tag)) fail(`active SVG element in ${path}`)
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name === 'xmlns' || name.startsWith('xmlns:')) continue
      const safeEmbeddedImage = ['href', 'src'].includes(name) && /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/u.test(value)
      if (safeEmbeddedImage) continue
      if (name.startsWith('on') || /(?:javascript:|https?:|\/\/|@import)/iu.test(value)) fail(`unsafe SVG attribute in ${path}`)
      if (['href', 'src'].includes(name) && !/^#[A-Za-z_][A-Za-z0-9_.:-]*$/u.test(value) && !/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/u.test(value)) fail(`external SVG input in ${path}`)
      for (const reference of value.matchAll(/url\s*\(([^)]*)\)/giu)) if (!/^\s*#[A-Za-z_][A-Za-z0-9_.:-]*\s*$/u.test(reference[1])) fail(`external SVG reference in ${path}`)
    }
  }
}

const validateGenerator = () => {
  regular644(generator)
  const source = readFileSync(pathAtRoot(generator), 'utf8')
  if (!/^<!doctype html>\s*/iu.test(source)) fail('generator must begin with the HTML doctype')
  const document = new JSDOM(source, { runScripts: 'outside-only', resources: undefined }).window.document
  if (document.doctype?.name.toLowerCase() !== 'html' || document.documentElement.lang !== 'en') fail('generator must have the expected HTML root')
  const allowed = new Set(['html', 'head', 'meta', 'title', 'style', 'body', 'main', 'div', 'i', 'span', 'section', 'p', 'h1', 'svg', 'path', 'rect', 'circle', 'img', 'script'])
  const allowedAttributes = {
    html: new Set(['lang']), meta: new Set(['charset', 'name', 'content']), main: new Set(['id']),
    div: new Set(['class', 'data-size', 'data-slot']), i: new Set(['class']), section: new Set(['class', 'data-copy', 'aria-label']),
    p: new Set(['class']), svg: new Set(['viewbox', 'aria-hidden', 'class']), path: new Set(['d']),
    rect: new Set(['x', 'y', 'width', 'height', 'rx']), circle: new Set(['cx', 'cy', 'r']), img: new Set(['src', 'alt'])
  }
  for (const element of document.querySelectorAll('*')) {
    const tag = element.localName.toLowerCase()
    if (!allowed.has(tag)) fail(`generator contains disallowed <${tag}>`)
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (!allowedAttributes[tag]?.has(name)) fail(`generator contains unexpected ${name} attribute on <${tag}>`)
      if (name.startsWith('on') || ['href', 'srcset', 'action', 'formaction'].includes(name) || /(?:javascript:|https?:|\/\/|data:)/iu.test(value)) fail(`generator contains an executable or network-capable attribute on <${tag}>`)
    }
  }
  const head = document.head
  const body = document.body
  if (!head || !body || document.documentElement.children.length !== 2 || [...head.children].map(element => element.localName).join(',') !== 'meta,meta,title,style' || !document.querySelector('main#cover') || [...body.children].map(element => element.localName).join(',') !== 'main,script') fail('generator must retain its exact head/body/cover structure')
  exactAttributes(head.children[0], { charset: 'UTF-8' })
  exactAttributes(head.children[1], { name: 'viewport', content: 'width=device-width, initial-scale=1.0' })
  if (head.children[2].textContent !== 'OneWorks Avatar README cover') fail('generator title changed')
  exactAttributes(document.querySelector('main#cover'), { id: 'cover' })
  const scripts = [...document.querySelectorAll('script')]
  const styles = [...document.querySelectorAll('style')]
  if (scripts.length !== 1 || scripts[0].attributes.length || hash(scripts[0].textContent) !== scriptDigest) fail('generator runtime contract changed')
  if (styles.length !== 1 || styles[0].attributes.length || /@import|url\s*\(|expression\s*\(|behavior\s*:|-moz-binding|(?:https?:|\/\/|javascript:|data:)/iu.test(styles[0].textContent)) fail('generator stylesheet must be static and self-contained')
  const images = [...document.querySelectorAll('img')]
  if (!images.length) fail('generator must contain snapshot images')
  const snapshotRoot = realpathSync(pathAtRoot('src/avatarPresetSnapshots'))
  const inputs = new Set()
  for (const image of images) {
    exactAttributes(image, { src: image.getAttribute('src'), alt: image.getAttribute('alt') })
    const sourcePath = image.getAttribute('src')
    if (!sourcePath?.startsWith('../src/avatarPresetSnapshots/') || sourcePath.includes('..', 3) || extname(sourcePath).toLowerCase() !== '.svg') fail(`invalid generator snapshot path ${sourcePath}`)
    const input = sourcePath.slice(3)
    if (inputs.has(input)) fail(`duplicate generator snapshot ${input}`)
    inputs.add(input)
    regular644(input)
    const resolved = realpathSync(pathAtRoot(input))
    if (!resolved.startsWith(`${snapshotRoot}${sep}`)) fail(`snapshot escapes avatarPresetSnapshots: ${input}`)
    validateSvg(input)
  }
}

const parseJpeg = data => {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) fail('JPEG is missing its SOI marker')
  let offset = 2
  let components
  let sawScan = false
  const markerAt = () => {
    if (data[offset] !== 0xff) fail('JPEG marker stream is malformed')
    while (data[offset] === 0xff) offset += 1
    if (offset >= data.length || data[offset] === 0x00) fail('JPEG marker stream is malformed')
    return data[offset++]
  }
  const finish = () => {
    if (!sawScan || components === undefined) fail('JPEG is missing a scan or supported frame')
    if (offset !== data.length) fail('the first JPEG EOI must be the final two bytes')
    return components
  }
  while (offset < data.length) {
    const marker = markerAt()
    if (marker === 0xd9) return finish()
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) fail('JPEG has an unexpected standalone marker')
    if (offset + 2 > data.length) fail('JPEG segment is truncated')
    const length = data.readUInt16BE(offset)
    if (length < 2 || offset + length > data.length) fail('JPEG segment length is invalid')
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) fail('JPEG frame segment is invalid')
      components = data[offset + 7]
    }
    offset += length
    if (marker !== 0xda) continue
    sawScan = true
    while (offset < data.length) {
      if (data[offset++] !== 0xff) continue
      const markerStart = offset - 1
      while (data[offset] === 0xff) offset += 1
      if (offset >= data.length) fail('JPEG entropy stream is truncated')
      const entropyMarker = data[offset++]
      if (entropyMarker === 0x00 || (entropyMarker >= 0xd0 && entropyMarker <= 0xd7)) continue
      if (entropyMarker === 0xd9) return finish()
      // This is a real marker after the scan, not entropy. Re-enter the
      // segment parser at its prefix so marker boundaries remain authoritative.
      offset = markerStart
      break
    }
  }
  fail('JPEG is missing a terminal EOI marker')
}

const validateCovers = () => {
  for (const cover of covers) {
    regular644(cover)
    const data = readFileSync(pathAtRoot(cover))
    if (data.length < 100_000 || data.length > 500_000) fail(`${cover} is not a bounded JPEG`)
    const components = parseJpeg(data)
    let decoded
    try { decoded = jpeg.decode(data, { useTArray: true, tolerantDecoding: false, maxResolutionInMP: 2 }) } catch { fail(`${cover} cannot be fully decoded`) }
    if (decoded.width !== 1600 || decoded.height !== 900 || decoded.data.length !== 1600 * 900 * 4 || components !== 3) fail(`${cover} must decode as a 1600x900 three-component color JPEG`)
    for (let index = 3; index < decoded.data.length; index += 4) if (decoded.data[index] !== 255) fail(`${cover} did not produce opaque RGB output`)
  }
}

const validateReadme = (path, expected) => {
  regular644(path)
  const rendered = markdown.render(readFileSync(pathAtRoot(path), 'utf8'))
  const document = new JSDOM(rendered, { runScripts: 'outside-only', resources: undefined }).window.document
  const pictures = [...document.querySelectorAll('picture')]
  if (pictures.length !== 1) fail(`${path} must render exactly one picture`)
  const elements = [...pictures[0].children]
  if (elements.map(element => element.localName).join(',') !== 'source,source,img') fail(`${path} picture must contain dark source, light source, then img`)
  exactAttributes(elements[0], { media: '(prefers-color-scheme: dark)', srcset: expected.dark })
  exactAttributes(elements[1], { media: '(prefers-color-scheme: light)', srcset: expected.light })
  exactAttributes(elements[2], { alt: expected.alt, src: expected.light, width: '1600' })
  const mentions = []
  for (const element of document.querySelectorAll('[src], [srcset]')) for (const attribute of ['src', 'srcset']) {
    const value = element.getAttribute(attribute)
    if (value?.includes('avatar-cover-')) mentions.push({ element, attribute, value })
  }
  if (mentions.length !== 3 || new Set(mentions.map(mention => `${mention.attribute}:${mention.value}`)).size !== 3 || mentions.some(mention => !coverSet.has(mention.value))) fail(`${path} has duplicate, unexpected, or cross-language cover media`)
}

const changed = changedPaths()
validateGenerator()
validateCovers()
validateReadme('README.md', { dark: covers[0], light: covers[1], alt: 'OneWorks Avatar — a growing gallery of geometric 3D avatars and pixel styles' })
validateReadme('README.zh-Hans.md', { dark: covers[2], light: covers[3], alt: 'OneWorks Avatar——不断扩展的几何 3D 头像与像素风格' })
console.log(`Validated README cover documentation assets across ${changed.length} changed path(s). JPEGs remain subject to normal PR visual review.`)
