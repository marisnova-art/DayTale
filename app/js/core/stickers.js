/* 스티커: 이야기 문장 안에서만 써요. Fluent Emoji 3D (MIT), Pixelarticons (MIT, 보상) */
const FLUENT = ['sun', 'cloud', 'suncloud', 'rain', 'snow', 'thunder', 'fog', 'moon', 'todo', 'event', 'note', 'idea', 'item', 'personal', 'scrap', 'photo', 'fire', 'sparkles', 'leaf', 'blossom', 'sunflower', 'snowman', 'sunrise', 'night'];
const PIXEL = { trophy: '#FFC86B', fire: '#FF8A5B', star: '#FFE07A', crown: '#FFD15C', cake: '#F28AB0', gift: '#B7A4FF', heart: '#FF7A8A', moon: '#C8D0E8', sun: '#FFC93C' };
const sticker = name => FLUENT.includes(name) ? `<img class="st" src="./stickers/fluent/${name}.webp" alt="" aria-hidden="true" draggable="false">` : '';
const reward = name => PIXEL[name] ? `<span class="px" style="--c:${PIXEL[name]};-webkit-mask-image:url(./stickers/pixel/${name}.svg);mask-image:url(./stickers/pixel/${name}.svg)" aria-hidden="true"></span>` : '';

export { reward, sticker };
