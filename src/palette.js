/* 色板数据与色板下拉（品牌色号表来自 palettes.js） */
/* ---------------- 色板数据（近似示例值；palettes.js 存在时自动覆盖） ---------------- */
const BUILTIN_PALETTE_DEFS = {
  perler: {
    name: 'Perler',
    colors: [
      {code:'P01',name:'White',hex:'#FFFFFF'},{code:'P02',name:'Cream',hex:'#F5EFDC'},
      {code:'P03',name:'Yellow',hex:'#FFE500'},{code:'P04',name:'Orange',hex:'#FF7A00'},
      {code:'P05',name:'Red',hex:'#DE1E26'},{code:'P06',name:'Bubblegum',hex:'#F79AC0'},
      {code:'P07',name:'Purple',hex:'#7A3B8F'},{code:'P08',name:'Dark Blue',hex:'#1E3A6E'},
      {code:'P09',name:'Light Blue',hex:'#59B3E0'},{code:'P10',name:'Dark Green',hex:'#1E6B3A'},
      {code:'P11',name:'Green',hex:'#4FA83D'},{code:'P12',name:'Brown',hex:'#6B4226'},
      {code:'P13',name:'Grey',hex:'#9B9B9B'},{code:'P14',name:'Black',hex:'#1A1A1A'},
      {code:'P15',name:'Tan',hex:'#D8B27E'},{code:'P16',name:'Light Brown',hex:'#A8763E'},
      {code:'P17',name:'Pink',hex:'#F4A7C3'},{code:'P18',name:'Light Green',hex:'#A9D86E'},
      {code:'P19',name:'Toothpaste',hex:'#BFE3EA'},{code:'P20',name:'Blush',hex:'#F8D0D5'},
      {code:'P21',name:'Raspberry',hex:'#D6407A'},{code:'P22',name:'Magenta',hex:'#C2185B'},
      {code:'P23',name:'Lavender',hex:'#C3A6E0'},{code:'P24',name:'Periwinkle',hex:'#A5B3E0'},
      {code:'P25',name:'Turquoise',hex:'#2AB8B0'},{code:'P26',name:'Kiwi Lime',hex:'#C8E04E'},
      {code:'P27',name:'Pastel Green',hex:'#BFE3B0'},{code:'P28',name:'Sand',hex:'#EFE0B0'},
      {code:'P29',name:'Light Grey',hex:'#D7D7D7'},{code:'P30',name:'Rust',hex:'#B45A2A'},
      {code:'P31',name:'Cheddar',hex:'#F2A900'},{code:'P32',name:'Neon Orange',hex:'#FF5400'},
      {code:'P33',name:'Neon Green',hex:'#4CFF00'},{code:'P34',name:'Neon Pink',hex:'#FF2D8A'},
      {code:'P35',name:'Neon Yellow',hex:'#F6FF00'},{code:'P36',name:'Neon Blue',hex:'#00B0FF'},
      {code:'P37',name:'Dark Grey',hex:'#5A5A5A'},{code:'P38',name:'Evergreen',hex:'#2E7D46'},
      {code:'P39',name:'Spice',hex:'#8E4A2A'}
    ]
  },
  hama: {
    name: 'Hama',
    colors: [
      {code:'H01',name:'White',hex:'#FFFFFF'},{code:'H02',name:'Cream',hex:'#F7EFD6'},
      {code:'H03',name:'Yellow',hex:'#FFE000'},{code:'H04',name:'Orange',hex:'#FF7800'},
      {code:'H05',name:'Red',hex:'#D72B1E'},{code:'H06',name:'Pink',hex:'#F6A6C6'},
      {code:'H07',name:'Purple',hex:'#6E3B8F'},{code:'H08',name:'Blue',hex:'#2A4B9C'},
      {code:'H09',name:'Light Blue',hex:'#6FC3E8'},{code:'H10',name:'Green',hex:'#3FA03C'},
      {code:'H11',name:'Light Green',hex:'#A7D84B'},{code:'H12',name:'Brown',hex:'#6B3D1F'},
      {code:'H13',name:'Grey',hex:'#9C9C9C'},{code:'H14',name:'Black',hex:'#1A1A1A'},
      {code:'H15',name:'Flesh',hex:'#F0C8A0'},{code:'H17',name:'Beige',hex:'#E0C8A0'},
      {code:'H18',name:'Turquoise',hex:'#1FA6A0'},{code:'H20',name:'Dark Green',hex:'#1E5B32'},
      {code:'H21',name:'Light Brown',hex:'#B0763C'},{code:'H22',name:'Dark Red',hex:'#8E1E1E'},
      {code:'H26',name:'Reddish Brown',hex:'#8E4A32'},{code:'H27',name:'Pastel Blue',hex:'#A8D8E8'},
      {code:'H28',name:'Pastel Green',hex:'#BFE0B0'},{code:'H29',name:'Pastel Pink',hex:'#F8D0D8'},
      {code:'H30',name:'Pastel Purple',hex:'#D8C0E8'},{code:'H31',name:'Pastel Yellow',hex:'#F8F0A0'},
      {code:'H43',name:'Dark Grey',hex:'#555555'},{code:'H44',name:'Light Grey',hex:'#D5D5D5'}
    ]
  },
  artkal: {
    name: 'Artkal',
    colors: [
      {code:'S01',name:'White',hex:'#FFFFFF'},{code:'S02',name:'Cream',hex:'#F6EED8'},
      {code:'S03',name:'Yellow',hex:'#FFE000'},{code:'S04',name:'Orange',hex:'#FF8000'},
      {code:'S05',name:'Red',hex:'#E02020'},{code:'S06',name:'Pink',hex:'#F8A0C0'},
      {code:'S07',name:'Purple',hex:'#8E3FB0'},{code:'S08',name:'Blue',hex:'#2848A0'},
      {code:'S09',name:'Light Blue',hex:'#60C0E0'},{code:'S10',name:'Green',hex:'#40A040'},
      {code:'S11',name:'Light Green',hex:'#B0D050'},{code:'S12',name:'Brown',hex:'#704020'},
      {code:'S13',name:'Grey',hex:'#A0A0A0'},{code:'S14',name:'Black',hex:'#202020'},
      {code:'S15',name:'Tan',hex:'#D8B888'},{code:'S16',name:'Light Brown',hex:'#B08040'},
      {code:'S17',name:'Magenta',hex:'#D02080'},{code:'S18',name:'Turquoise',hex:'#20B0A0'},
      {code:'S19',name:'Lavender',hex:'#C0A0E0'},{code:'S20',name:'Blush',hex:'#F8D0D0'},
      {code:'S21',name:'Dark Green',hex:'#287038'},{code:'S22',name:'Dark Blue',hex:'#183060'},
      {code:'S23',name:'Dark Grey',hex:'#606060'},{code:'S24',name:'Rust',hex:'#C06030'}
    ]
  }
};


const PALETTE_DEFS = Object.assign({}, BUILTIN_PALETTE_DEFS,
  (typeof window !== 'undefined' && window.PALETTE_DEFS) ? window.PALETTE_DEFS : {});

const palettes = {};
for (const key in PALETTE_DEFS) {
  const def = PALETTE_DEFS[key];
  palettes[key] = { name: def.name, colors: def.colors.map(c => Object.assign({}, c, { rgb: hexToRgb(c.hex) })) };
}

/* ---------------- 初始化 ---------------- */
(function populatePaletteSelect() {
  const sel = document.getElementById('palette');
  sel.innerHTML = '';
  for (const key in palettes) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = palettes[key].name + ' (' + palettes[key].colors.length + ' 色)';
    sel.appendChild(opt);
  }
  sel.value = currentPalette;
})();
