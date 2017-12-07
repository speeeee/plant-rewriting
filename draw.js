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
    if(s[i+1]=='(') { q = s.indexOf(')',i); ret.push({ type:"module", val:{ n:s[i], p:s.slice(i+2,q).join("") } }); i=q+1; }
    else if(s[i]==':') { q = s.join("").indexOf("->",i); ret.push({ type:"lexp", val:s.slice(i+1,q) }); i=q+2; }
    else { ret.push({ type:"term", val:s[i] }); i++; } } return ret; }

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
      if(q !== undefined) { vec3.transformMat3(nlast.h,nlast.h,q);
        vec3.transformMat3(nlast.l,nlast.l,q); vec3.transformMat3(nlast.u,nlast.u,q); } return n;
    case "module":
      switch(c.val.n) {
        case 'F': var np = vec3.create(); vec3.add(np,nlast.pos,vec3.scale({},nlast.h,Number(c.val.p)));
          if(n.draw.length==0) { n.draw = nlast.pos; n.draw = f32concat(n.draw,np); }
          else { n.draw = f32concat(n.draw,nlast.pos); n.draw = f32concat(n.draw,np); } nlast.pos = np; return n; }
      var z = Number(c.val.p);
      var q = {'+':r_U(z),'-':r_U(-z),'&':r_L(z),'^':r_L(-z),'\\':r_H(z),'/':r_H(-z),'|':r_U(Math.PI)}[c.val.n];
      if(q !== undefined) { vec3.transformMat3(nlast.h,nlast.h,q);
        vec3.transformMat3(nlast.l,nlast.l,q); vec3.transformMat3(nlast.u,nlast.u,q); } return n; } }
    ,{ states: [{ pos: vec3.fromValues(0,0,0), h: vec3.fromValues(0,1,0)
                , l: vec3.fromValues(1,0,0), u: vec3.fromValues(0,0,-1) }], draw: []}).draw; }

// repetitive and not ideal.
//parse_expr : String -> String
/*function parse_expr(a) {
  return a.split("@").reduce(function(n,c) { var q; var cn = n.length-1;
    switch(c) {
      case "+": q = (Number(n[cn])+Number(n[cn-1])).toString(); n.pop(); n.pop(); n.push(q); return n;
      case "-": q = (Number(n[cn-1])-Number(n[cn])).toString(); n.pop(); n.pop(); n.push(q); return n;
      case "*": q = (Number(n[cn])*Number(n[cn-1])).toString(); n.pop(); n.pop(); n.push(q); return n;
      case "/": q = (Number(n[cn-1])/Number(n[cn])).toString(); n.pop(); n.pop(); n.push(q); return n;
      case "^": q = Math.pow(Number(n[cn-1]),Number(n[cn])).toString(); n.pop(); n.pop(); n.push(q); return n;
      default: n.push(c); return n; } },[]).toString(); }*/

//parse_expr : String -> Number
function parse_expr(a) { var op_loc;
  var q = parseFloat(a); if(q.toString()=="NaN"&&a[0]=='{') { var d = 1; var i = 0;
    for(i=1;d!=0;i++) { if(a[i]=='{') { d++; } else if(a[i]=='}') { d--; } } q = parse_expr(a.slice(1,i-1));
    op_loc = i; }
  else { op_loc = q.toString().length; } // handle { and } recursively.
  switch(a[op_loc]) {
    case "+": return q+parse_expr(a.slice(op_loc+1));
    case "-": return q-parse_expr(a.slice(op_loc+1));
    case "*": return q*parse_expr(a.slice(op_loc+1));
    case "/": return q/parse_expr(a.slice(op_loc+1));
    case "^": return Math.pow(q,parse_expr(a.slice(op_loc+1)));
    default: return q; } }

// TODO: more
//parse_production : List Token -> Production
function parse_production(t) {
  var cond_loc = t.map(function(a) { return a.type; }).indexOf("lexp");
  return { pred:t[0], cond:t[cond_loc], succ:t.slice(cond_loc+1,t.length) }; }

// TODO: attempt to match production with condition (also define '<','>',etc. for parse_expr, even if the two languages
//       are disconnected in the specification.
//match_production : Production -> Token -> List Token | False
function match_production(p,t) {
  var ret = JSON.parse(JSON.stringify(p.succ));
  if(p.pred.type=="term"&&p.pred.val==t.val) { return ret; }
  else if(p.pred.type=="module"&&p.pred.val.n==t.val.n) {
    var params = p.pred.val.p.split(","); var nvals = t.val.p.split(",");
    for(var j=0;j<ret.length;j++) { if(ret[j].type=="module") { for(var i=0;i<params.length;i++) {
        var g = new RegExp(params[i],"g"); ret[j].val.p = ret[j].val.p.replace(g,nvals[i]); }
      ret[j].val.p = ret[j].val.p.split(",").map(function(e) { return parse_expr(e).toString(); }).join(","); } }
    return ret; } return false; }

/*function parse_production(t) {
  var q = t.replace(/\s/g,'').split("->");
  return { pred: q[0], succ: q[1] }; }*/

// apply_productions assumes determinism.
//apply_productions : List Production -> List Token -> List Token -> List Token
function apply_productions(ps,init) {
  var lret = init; var ret = []; var q;
  for(var k=0;k<lret.length;k++) { var j=0; for(j=0;j<ps.length;j++) {
      q = match_production(ps[j],lret[k]); if(q) { ret = ret.concat(q); break; } }
    if(j==ps.length) { ret.push(lret[k]); } } return ret; }

/*function apply_productions(ps,d,init) {
  var ret = []; var lret = init.split(""); var j = 0;
  for(var i=0;i<d;i++) { for(var k=0;k<lret.length;k++) { for(j=0;j<ps.length;j++) {
      if(lret[k]==ps[j].pred) { ret = ret.concat(ps[j].succ.split("")); break; } } if(j==ps.length) { ret.push(lret[k]); } }
    lret = ret.slice(0); ret = []; } return lret.join(""); }*/

function compile_program(str) { var depth = 1; var tht = 0;
  var prog = str.split("\n"); var i;
  for(var i=0;prog[i][0]=='#';i++) { var q = prog[i].split(" "); switch(q[0]) {
    case "#depth": depth = Number(q[1]);
    case "#angle": tht = Number(q[1]); } }

  var prods = prog.slice(i+1).map(function(a){ return parse_production(tokenize(a)) });
  var e = tokenize(prog[i]);
  for(var z=0;z<depth;z++) { e = apply_productions(prods,e); } console.log(e);

  var r = parse(e,tht); console.log(r); sz = r.length/3;
  gl.deleteVertexArray(vao);

  var pos_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pos_buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(r), gl.STATIC_DRAW);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(pos_attrib);

  gl.vertexAttribPointer(pos_attrib,3,gl.FLOAT,false,0,0); }

// testing
/*var prod_a = parse_production(tokenize("A:_->AB"));
var prod_b = parse_production(tokenize("A(t):_->A(t+1)B"));
var prod_c = parse_production(tokenize("C(t,c):_->BC(t+5,c+{2*3})D(t+4)A"));
var prods = [prod_a,prod_b,prod_c];
console.log(match_production(prod_a,tokenize("A")[0]));
console.log(match_production(prod_b,tokenize("A(3)")[0]));
console.log(match_production(prod_c,tokenize("C(2,3)")[0]));
console.log(apply_productions(prods,tokenize("AAA(3)C(4,5)")));*/
