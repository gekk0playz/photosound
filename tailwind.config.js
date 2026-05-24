/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { brand: { 50:"#fdf4ff",100:"#f9e8ff",200:"#f0d0fe",300:"#e3aafc",400:"#d07bf8",500:"#b84ef1",600:"#9f2fd4",700:"#8622b0",800:"#6f1d90",900:"#5c1c73"}},
    animation: { 'waveform':'waveform 1.2s ease-in-out infinite','float':'float 6s ease-in-out infinite' },
    keyframes: { waveform:{'0, 100%':{ transform:'scaleY(0.4)'},'50%':{ transform:'scaleY(1)'}} }
  }},
  plugins: []
};
