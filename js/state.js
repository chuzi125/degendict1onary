import { $ } from './lib/utils.js';

export const state = { cat:'ALL', term:false, termOut:null };
try{ state.term = localStorage.getItem('dd-term')==='1'; }catch(e){}

export function applyTerm(){
  document.body.classList.toggle('term',state.term);
  $('#termToggle').setAttribute('aria-pressed',state.term);
  try{ localStorage.setItem('dd-term',state.term?'1':'0'); }catch(e){}
}
