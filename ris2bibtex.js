/**
 * この関数はRIS形式のテキストを解析し、BibTeX形式へ変換いたします。
 * 参考文献の要素を抽出し、BibTeXフォーマットに適切にマッピングします。
 * @param {string} risContent - RIS形式のテキスト
 * @returns {string} BibTeXContent BibTeX形式のテキスト
 */
function ris2bibtex(risContent) {
  let BibTeXContent = "";
  BibTeXContent = `@article{SUGAI2024116771,
title={Diffusive-discrete crack transition without remeshing achieved by extended B-spline-based implicit material point method},
journal={Computer Methods in Applied Mechanics and Engineering},
volume={421},
pages={116771},
year={2024},
issn={0045-7825},
doi={https://doi.org/10.1016/j.cma.2024.116771},
url={https://www.sciencedirect.com/science/article/pii/S0045782524000276},
author={Riichi Sugai and Jike Han and Shuji Moriguchi and Kenjiro Terada},
keywords={Material point method, Extended B-splines, Crack propagation, Strong discontinuity, Finite strain},
abstract={A novel procedure is proposed to realize a transition from a diffusive to discrete crack topology with the help of extended B-spline (EBS) basis functions in the implicit material point method. The crack initiation and propagation are determined by the crack phase-field model, and a damage field is obtained as the diffusive crack. Based on the damage gradients, the location of the discrete crack surface is identified, and the crack transition is performed by applying the EBS basis functions. Here, the EBS basis functions are constructed so that the support domain of the basis function contains only a single physical domain separated by the crack surface. Accordingly, the crack transition is achieved without additional degrees of freedom to represent the individual movement of separated domains. Additionally, remeshing with reconfiguration of connectivity and reconstruction of tangent matrices are not needed. To verify the performance of the developed scheme, three representative numerical examples are presented.}
}`
  return BibTeXContent;
}
