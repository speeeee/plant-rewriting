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

// TODO: make position random.
// TODO: add brackets for stack.
// TODO: add normals (possibly not in this function).
//parse : String -> List Number
function parse(str,a) {
  return str.split('').reduce(
    function(n,c) {
      switch(c) {
        case 'F':
          var np = vec3.create(); vec3.add(np,n.states[0].pos,n.states[0].h);
          if(n.draw.length==0) { n.draw = n.states[0].pos; n.draw = f32concat(n.draw,np); }
          else { n.draw = f32concat(n.draw,n.states[0].pos); n.draw = f32concat(n.draw,np); } n.states[0].pos = np; return n; }
      var q = {'+':r_U(a),'-':r_U(-a),'&':r_L(a),'^':r_L(-a),'\\':r_H(a),'/':r_H(-a),'|':r_U(Math.PI)}[c];
      if(q !== undefined) { console.log(q); vec3.transformMat3(n.states[0].h,n.states[0].h,q);
        vec3.transformMat3(n.states[0].l,n.states[0].l,q); vec3.transformMat3(n.states[0].u,n.states[0].u,q); } return n; }
    ,{ states: [{ pos: vec3.fromValues(0,0,0), h: vec3.fromValues(1,0,0)
                , l: vec3.fromValues(0,0,1), u: vec3.fromValues(0,1,0) }], draw: []}).draw; }