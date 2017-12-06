var cos = Math.cos; var sin = Math.sin;
function r_U(a) {
  return mat3.fromValues(cos(a),sin(a),0, -sin(a),cos(a),0, 0,0,1); }
function r_L(a) {
  return mat3.fromValues(cos(a),0,-sin(a), 0,1,0, sin(a),0,cos(a)); }
function r_H(a) {
  return mat3.fromValues(1,0,0, 0,cos(a),-sin(a), 0,sin(a),cos(a)); }
function minus(a) { return -a; }

function f32concat(a,b) {
  var r = new Float32Array(a.length+b.length);
  r.set(a); r.set(b,a.length); return r; }

// NOTE: indexOf returns 1.
// NOTE: using String.join is pretty bad, but works.
// creates tokens for production a : b -> c .
// tokenize : String -> List Token
function tokenize(str) { var q; var ret = []; var s = str.replace(/\s/g,'').split('');
  // note: looking for first closing parenthesis is fine since the language in between parentheses cannot contain parentheses.
  for(var i=0;i<s.length;) {
    if(s[i+1]=='(') { q = s.indexOf(')',i); ret.push({ type:"module", val:{ n:s[i], p:s.slice(i+2,q) } }); i=q+1; }
    else if(s[i]==':') { q = s.join("").indexOf("->",i); ret.push({ type:"lexp", val:s.slice(i+1,q) }); i=q+2; }
    else { ret.push({ type:"term", val:s[i] }); i++; } } return ret; }

// TODO: make position random.
// TODO: add brackets for stack.
// TODO: add normals (possibly not in this function).
//parse : List Token -> List Number
function parse(str,a) {
  return str.reduce(
    function(n,c) { var nlast = n.states[n.states.length-1];
    switch(c.type) {
    case "term":
      switch(c.val) {
        case 'F':
          var np = vec3.create(); vec3.add(np,nlast.pos,nlast.h);
          if(n.draw.length==0) { n.draw = nlast.pos; n.draw = f32concat(n.draw,np); }
          else { n.draw = f32concat(n.draw,nlast.pos); n.draw = f32concat(n.draw,np); } nlast.pos = np; return n;
        case '[': var ncl = Object.assign({},nlast);
          n.states.push(ncl); return n;
        case ']': n.states.pop(); return n; }
      var q = {'+':r_U(a),'-':r_U(-a),'&':r_L(a),'^':r_L(-a),'\\':r_H(a),'/':r_H(-a),'|':r_U(Math.PI)}[c.val];
      if(q !== undefined) { console.log(q); vec3.transformMat3(nlast.h,nlast.h,q);
        vec3.transformMat3(nlast.l,nlast.l,q); vec3.transformMat3(nlast.u,nlast.u,q); } return n; } }
    ,{ states: [{ pos: vec3.fromValues(0,0,0), h: vec3.fromValues(1,0,0)
                , l: vec3.fromValues(0,0,1), u: vec3.fromValues(0,1,0) }], draw: []}).draw; }

//apply_production : List Production -> String -> String -> String
//function apply_productions(ps,init,s) {
   
