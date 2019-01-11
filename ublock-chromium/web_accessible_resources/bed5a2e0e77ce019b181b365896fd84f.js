(function(){
	var l = {};
	var noopfn = function() {
		;
	};
	var props = [
		"$j","Ad","Bd","Cd","Dd","Ed","Fd","Gd","Hd","Id","Jd","Nj","Oc","Pc","Pe",
		"Qc","Qe","Rc","Re","Ri","Sc","Tc","Uc","Vc","Wc","Wg","Xc","Xg","Yc","Yd",
		"ad","ae","bd","bf","cd","dd","ed","ef","ek","fd","fg","fh","fk","gd","hd",
		"ig","ij","jd","kd","ke","ld","md","mi","nd","od","oh","pd","pf","qd","rd",
		"sd","td","ud","vd","wd","wg","xd","xh","yd","zd",
		"$d","$e","$k","Ae","Af","Aj","Be","Ce","De","Ee","Ek","Eo","Ep","Fe","Fo",
		"Ge","Gh","Hk","Ie","Ip","Je","Ke","Kk","Kq","Le","Lh","Lk","Me","Mm","Ne",
		"Oe","Pe","Qe","Re","Rp","Se","Te","Ue","Ve","Vp","We","Xd","Xe","Yd","Ye",
		"Zd","Ze","Zf","Zk","ae","af","al","be","bf","bg","ce","cp","df","di","ee",
		"ef","fe","ff","gf","gm","he","hf","ie","je","jf","ke","kf","kl","le","lf",
		"lk","mf","mg","mn","nf","oe","of","pe","pf","pg","qe","qf","re","rf","se",
		"sf","te","tf","ti","ue","uf","ve","vf","we","wf","wg","wi","xe","ye","yf",
		"yk","yl","ze","zf","zk"
	];
	for (var i = 0; i < props.length; i++) {
		l[props[i]] = noopfn;
	}
	window.L = window.J = l;
})();
