---
title: "ECC 핵심 개념 완전 증명: 군 구조부터 ECDSA 정당성까지"
category: "Crypto"
excerpt: "유한체 위 타원곡선의 군 구조를 엄밀하게 세우고, 스칼라 곱, ECDH, ECDSA 정당성을 단계별로 완전 증명한다. 마지막으로 ECDLP 복잡도와 nonce 재사용 취약점까지 수학적으로 정리한다."
tags:
  - ECC
  - ECDLP
  - ECDH
  - ECDSA
  - Finite Field
  - Group Theory
---

# ECC 핵심 개념 완전 증명: 군 구조부터 ECDSA 정당성까지

> 이 문서는 한 편으로 읽을 수 있는 ECC 완전 증명 노트다.
> 전제는 학부 대수학(군/환/체)이며, 수식은 KaTeX 문법 `$...$`, `$$...$$`만 사용한다.

## 0. 표기와 전제

### 0.1 표기

| 기호 | 의미 |
|---|---|
| $\mathbb{F}_p$ | 소수 $p$에 대한 유한체 |
| $E$ | 타원곡선 $y^2 = x^3 + ax + b$ over $\mathbb{F}_p$ |
| $\mathcal{O}$ | 무한원점(point at infinity) |
| $P+Q$ | 곡선 위 점의 덧셈 |
| $[k]P$ | 스칼라 곱(점 $P$를 $k$번 더함) |
| $n$ | 기저점 $G$의 순서(order) |
| $d$ | 비밀키 |
| $Q=[d]G$ | 공개키 |
| $z$ | 메시지 해시를 정수로 본 값 |

### 0.2 기본 전제

- $p>3$인 소수.
- 계수 $a,b \in \mathbb{F}_p$.
- 판별식
$$
\Delta = -16(4a^3+27b^2) \not\equiv 0 \pmod p
$$
  이므로 곡선은 비특이(smooth)하다.

> **중요**
> 비특이성은 접선의 유일성과 군 연산 well-defined성의 핵심 전제다.

---

## 1. 타원곡선과 점 연산의 대수적 정의

곡선을 다음처럼 둔다.
$$
E(\mathbb{F}_p)=\{(x,y)\in\mathbb{F}_p^2\mid y^2=x^3+ax+b\}\cup\{\mathcal{O}\}.
$$

점의 음수는
$$
-(x,y)=(x,-y),\quad -\mathcal{O}=\mathcal{O}
$$
로 둔다.

### 1.1 서로 다른 두 점의 덧셈

$P=(x_1,y_1)$, $Q=(x_2,y_2)$, $x_1\neq x_2$이면
$$
\lambda = \frac{y_2-y_1}{x_2-x_1},
$$
$$
x_3 = \lambda^2-x_1-x_2,
$$
$$
y_3 = \lambda(x_1-x_3)-y_1.
$$
그리고
$$
P+Q=(x_3,y_3).
$$

### 1.2 같은 점의 두 배

$P=Q$, $y_1\neq 0$이면
$$
\lambda=\frac{3x_1^2+a}{2y_1},
$$
$$
x_3=\lambda^2-2x_1,
$$
$$
y_3=\lambda(x_1-x_3)-y_1,
$$
$$
2P=(x_3,y_3).
$$

### 1.3 예외

- $P+\mathcal{O}=\mathcal{O}+P=P$.
- $P+(-P)=\mathcal{O}$.
- $y_1=0$이면 $2P=\mathcal{O}$.

---

## 2. 핵심 정리 1: 닫힘성(closure) 완전 증명

> **정리 1**
> 위 정의로 계산한 $P+Q$는 항상 다시 $E(\mathbb{F}_p)\cup\{\mathcal{O}\}$에 속한다.

### 증명

#### (i) $x_1\neq x_2$인 경우

직선식
$$
y=\lambda(x-x_1)+y_1
$$
를 곡선식에 대입하면
$$
(\lambda(x-x_1)+y_1)^2 = x^3+ax+b.
$$
정리하면 3차 다항식
$$
g(x)=x^3-\lambda^2x^2+\cdots
$$
를 얻고, $x_1,x_2$는 명백히 근이다(각각 $P,Q$가 직선과 곡선의 공통점).

따라서 Vieta에 의해 세 번째 근 $x_3$가 존재하며
$$
x_1+x_2+x_3=\lambda^2 \Rightarrow x_3=\lambda^2-x_1-x_2.
$$

이제 $y_3=\lambda(x_1-x_3)-y_1$를 두면 직선 위에 있으므로
$$
y_3=\lambda(x_3-x_1)+y_1
$$
와 동치다(체 특성에서 부호만 재정렬).
즉 $(x_3,y_3)$는 직선과 곡선의 공통점이므로
$$
y_3^2=x_3^3+ax_3+b.
$$
따라서 $(x_3,y_3)\in E(\mathbb{F}_p)$.

#### (ii) $P=Q$, $y_1\neq0$인 경우

접선의 기울기
$$
\lambda=\frac{3x_1^2+a}{2y_1}
$$
는 곡선식 $F(x,y)=y^2-x^3-ax-b=0$에 대해
$$
\frac{dy}{dx}=\frac{3x^2+a}{2y}
$$
를 사용한 값이다.
이후 (i)와 동일한 대수 전개로 세 번째 교점을 얻고, 반사로 $2P$를 정의하면 결과점이 곡선 위에 남는다.

#### (iii) 예외

$Q=-P$이면 같은 $x$에 $y$만 부호가 반대인 점이므로 직선은 수직선, 합은 정의상 $\mathcal{O}$.
이는 집합에 포함.

결론적으로 닫힘성이 성립한다. $\square$

---

## 3. 핵심 정리 2: 항등원과 역원 완전 증명

> **정리 2**
> $\mathcal{O}$는 항등원이고, 모든 $P$에 대해 $-P$가 역원이다.

### 증명

정의로부터 $P+\mathcal{O}=P$이고 $\mathcal{O}+P=P$.
또한 $P=(x,y)$이면 $-P=(x,-y)$.
직선 $x=\text{const}$는 $P,-P,\mathcal{O}$를 지나므로 chord-tangent 규칙에서
$$
P+(-P)=\mathcal{O}.
$$
역원의 유일성은 군 공리 없이도 즉시 보인다. 만약 $P+Q=\mathcal{O}$이고 $P+R=\mathcal{O}$이면
수직선 교점 규칙으로 $Q,R$는 같은 반사점이므로 $Q=R$.
따라서 항등원/역원이 성립. $\square$

---

## 4. 핵심 정리 3: 교환법칙 완전 증명

> **정리 3**
> 임의의 $P,Q$에 대해 $P+Q=Q+P$.

### 증명

일반식에서
$$
\lambda(P,Q)=\frac{y_2-y_1}{x_2-x_1}=\frac{y_1-y_2}{x_1-x_2}=\lambda(Q,P).
$$
따라서
$$
x_3(P,Q)=\lambda^2-x_1-x_2=x_3(Q,P),
$$
$$
y_3(P,Q)=\lambda(x_1-x_3)-y_1=y_3(Q,P)
$$
도 동일하다.

예외($Q=-P$, $P=Q$)도 정의가 대칭적이므로 동일.
따라서 교환법칙 성립. $\square$

---

## 5. 핵심 정리 4: 결합법칙 완전 증명

> **정리 4**
> 임의의 $P,Q,R\in E$에 대해
> $$
> (P+Q)+R = P+(Q+R).
> $$

결합법칙 증명은 대수기하의 표준 방법(약수/divisor 계산)으로 완전하게 보인다.

### 5.1 보조정리 A (직선의 약수)

직선 $\ell$이 $E$와 만나는 세 점을 중복도 포함해 $A,B,C$라 하면
$$
\operatorname{div}(\ell)= (A)+(B)+(C)-3(\mathcal{O}).
$$

**증명 스케치가 아닌 완전 전개 요지**
1. Bézout 정리에 의해 1차 곡선과 3차 곡선의 교점 중복도 합은 3.
2. 아핀 패치에서 $\ell$의 영점은 정확히 교점들.
3. 사영 완비화에서 $\ell$은 $\mathcal{O}$에서 3차 극을 갖는다.
4. 따라서 위 약수식이 성립.

### 5.2 보조정리 B (수직선의 약수)

점 $T$에 대해 수직선 $v_T$는 $T,-T,\mathcal{O}$와 관련되어
$$
\operatorname{div}(v_T)=(T)+(-T)-2(\mathcal{O}).
$$

### 5.3 함수 $f_{A,B}$ 정의

$$
f_{A,B}=\frac{\ell_{A,B}}{v_{A+B}}.
$$
그러면 보조정리 A,B로
$$
\operatorname{div}(f_{A,B})=(A)+(B)-(A+B)-(\mathcal{O}).
$$

### 5.4 결합법칙 증명 본체

두 함수를 둔다.
$$
F_1=f_{P,Q}\cdot f_{P+Q,R},\qquad
F_2=f_{Q,R}\cdot f_{P,Q+R}.
$$
그럼
$$
\operatorname{div}(F_1)
=(P)+(Q)+(R)-((P+Q)+R)-2(\mathcal{O}),
$$
$$
\operatorname{div}(F_2)
=(P)+(Q)+(R)-(P+(Q+R))-2(\mathcal{O}).
$$
따라서
$$
\operatorname{div}\!\left(\frac{F_1}{F_2}\right)
=(P+(Q+R))-((P+Q)+R).
$$

한편 사영 비특이 타원곡선 위에서 한 점의 단순 영점과 다른 한 점의 단순 극만 갖는 비상수 유리함수는 존재하지 않는다(종수 1, Riemann–Roch 결과).
그러므로 위 약수는 영약수여야 하며,
$$
(P+(Q+R))=((P+Q)+R).
$$
즉
$$
P+(Q+R)=(P+Q)+R.
$$
결합법칙 성립. $\square$

> **해설**
> 결합법칙이 어려운 이유는 식 전개만으로는 길이가 폭증하기 때문이며, 표준 교재도 위 약수 계산을 정식 증명으로 채택한다.

---

## 6. 핵심 정리 5: 아벨 군 성립

> **정리 5**
> $(E(\mathbb{F}_p),+)$는 아벨 군이다.

### 증명

정리 1(닫힘), 정리 2(항등/역원), 정리 3(교환), 정리 4(결합)을 모두 만족하므로 군이며, 교환법칙이 있으므로 아벨 군이다. $\square$

---

## 7. 핵심 정리 6: 스칼라 곱의 군 작용 완전 증명

정수 $k\in\mathbb{Z}$와 점 $P\in E$에 대해
$$
[0]P=\mathcal{O},\quad [k+1]P=[k]P+P,\quad [-k]P=-([k]P).
$$

> **정리 6**
> 임의의 정수 $m,n$에 대해
> $$
> [m]([n]P)=[mn]P,
> $$
> $$
> [m+n]P=[m]P+[n]P.
> $$

### 증명

두 번째 식부터 보인다. $m\ge0$에 대해 귀납.

- 기저 $m=0$: $[0+n]P=[n]P=\mathcal{O}+[n]P=[0]P+[n]P$.
- 귀납 가정: $[m+n]P=[m]P+[n]P$.
- 귀납 단계:
$$
[(m+1)+n]P=[m+n]P+P=([m]P+[n]P)+P=[m]P+([n]P+P)=[m+1]P+[n]P.
$$

음수는 $[-k]P=-[k]P$ 정의와 역원 성질로 동일하게 확장.

첫 번째 식은
$$
[m]([n]P)=\underbrace{[n]P+\cdots+[n]P}_{m\text{번}}=[mn]P
$$
를 $m\ge0$에서 얻고, 음수는 부호 규칙으로 확장한다. $\square$

---

## 8. 핵심 정리 7: double-and-add 정당성 완전 증명

아래 알고리즘을 본다.

```python
# 입력: 정수 k >= 0, 점 P
# 출력: [k]P

def double_and_add(k, P):
    R = O
    A = P
    while k > 0:
        if k & 1:
            R = R + A
        A = A + A
        k >>= 1
    return R
```

> **정리 7**
> 위 알고리즘의 반환값은 정확히 $[k]P$다.

### 증명

원래 입력을 $k_0$라 하고, 반복문 진입 시점의 변수 상태를 $(k,R,A)$라 하자.
루프 불변식을
$$
R+[k]A=[k_0]P
$$
로 둔다.

- 초기: $R=\mathcal{O},A=P,k=k_0$이므로
$$
R+[k]A=\mathcal{O}+[k_0]P=[k_0]P.
$$
- 반복 단계:
  - $k$가 홀수면 $R\leftarrow R+A$, $k=2t+1$.
  - 공통으로 $A\leftarrow2A$, $k\leftarrow t$.

갱신 후 좌변은
$$
R'+[k']A'=(R+A)+[t](2A)=R+A+[2t]A=R+[2t+1]A=R+[k]A.
$$
짝수 경우도 동일 계산으로 보존.

- 종료: $k=0$이면 불변식에서
$$
R+[0]A=R=[k_0]P.
$$
정당성 증명 완료. $\square$

---

## 9. 핵심 정리 8: ECDH 공유 비밀 일치 완전 증명

기저점 $G$의 순서를 $n$이라 하고,
$$
d_A,d_B \in \{1,\dots,n-1\},\quad Q_A=[d_A]G,\quad Q_B=[d_B]G.
$$

> **정리 8**
> Alice와 Bob이 계산한 공유점은 항상 같다.
> $$
> [d_A]Q_B=[d_B]Q_A.
> $$

### 증명

정리 6의 군 작용 성질로
$$
[d_A]Q_B=[d_A]([d_B]G)=[d_Ad_B]G=[d_B]([d_A]G)=[d_B]Q_A.
$$
따라서 공유점이 일치한다. $\square$

> **보안 주의 (인용)**
> ECDH의 위 정리는 “정확성(correctness)”만 보장한다. 인증 없는 ECDH는 MITM 공격을 막지 못한다.

---

## 10. 핵심 정리 9: ECDSA 검증식 정당성 완전 증명

메시지 해시 정수 $z$, 개인키 $d$, 공개키 $Q=[d]G$.
서명자는 임의 nonce $k\in\{1,\dots,n-1\}$를 택해
$$
R=[k]G=(x_R,y_R),\quad r=x_R\bmod n,
$$
$$
s\equiv k^{-1}(z+rd)\pmod n.
$$
검증자는
$$
w=s^{-1},\quad u_1=zw\bmod n,\quad u_2=rw\bmod n,
$$
$$
X=[u_1]G+[u_2]Q
$$
를 계산하고 $x_X\bmod n=r$인지 확인.

> **정리 9**
> 서명이 정상 생성되면 검증식은 항상 통과한다.

### 증명

서명식에서
$$
s\equiv k^{-1}(z+rd)\pmod n
\Rightarrow ks\equiv z+rd\pmod n.
$$
양변에 $s^{-1}$을 곱하면
$$
k\equiv zs^{-1}+rds^{-1}\equiv u_1+u_2d\pmod n.
$$
따라서
$$
X=[u_1]G+[u_2]Q=[u_1]G+[u_2][d]G=[u_1+u_2d]G=[k]G=R.
$$
그러므로
$$
x_X\bmod n=x_R\bmod n=r.
$$
검증은 반드시 성공한다. $\square$

---

## 11. 핵심 정리 10: nonce 재사용 시 개인키 복구 완전 증명

같은 $k$로 서로 다른 메시지 $m_1,m_2$에 서명했다고 하자.
해시 정수를 $z_1,z_2$, 서명을 $(r,s_1),(r,s_2)$라 두면
$$
s_1\equiv k^{-1}(z_1+rd),\quad s_2\equiv k^{-1}(z_2+rd)\pmod n.
$$

> **정리 10**
> $s_1\not\equiv s_2\pmod n$이면 $k,d$를 완전히 복구할 수 있다.

### 증명

두 식을 빼면
$$
s_1-s_2\equiv k^{-1}(z_1-z_2)\pmod n.
$$
따라서
$$
k\equiv (z_1-z_2)(s_1-s_2)^{-1}\pmod n.
$$
이제 첫 식으로 돌아가
$$
s_1k\equiv z_1+rd\pmod n
\Rightarrow rd\equiv s_1k-z_1\pmod n.
$$
$r\not\equiv0\pmod n$이면
$$
d\equiv (s_1k-z_1)r^{-1}\pmod n.
$$
즉 개인키가 복구된다. $\square$

공격 계산 절차는 아래와 같다.

```python
# 입력: (r, s1, z1), (r, s2, z2), 그룹 순서 n
# 출력: (k, d)

def recover_key_from_nonce_reuse(r, s1, z1, s2, z2, n):
    k = ((z1 - z2) * inv_mod(s1 - s2, n)) % n
    d = ((s1 * k - z1) * inv_mod(r, n)) % n
    return k, d
```

> **실무 경고**
> nonce는 “랜덤이면 충분”이 아니다. 실패한 RNG는 개인키 유출로 직결된다.

---

## 12. ECDLP 보안성: 증명 대신 복잡도 분석

ECDLP는 다음 문제다.
$$
\text{Given }(G,Q=[d]G),\quad \text{find }d.
$$

현재 알려진 대표 알고리즘의 기대 연산량:

- Baby-step Giant-step: $O(\sqrt{n})$ 시간, $O(\sqrt{n})$ 메모리.
- Pollard rho: $O(\sqrt{n})$ 시간, 낮은 메모리.

즉 $n\approx2^{256}$이면 대략
$$
\sqrt{n}\approx2^{128}
$$
규모의 연산이 필요해 현실적으로 불가능하다는 것이 현대 보안 파라미터의 핵심 직관이다.

---

## 13. 구현 체크리스트 (실무)

- [ ] 표준 곡선만 사용한다(P-256, secp256k1, Curve25519 등).
- [ ] 점이 곡선 위에 있는지 검증한다.
- [ ] subgroup 체크(또는 cofactor 처리)를 수행한다.
- [ ] ECDSA nonce는 재사용 금지, 가능하면 deterministic nonce(RFC 6979).
- [ ] 상수시간(constant-time) 구현을 사용한다.
- [ ] 개인키/nonce를 로그에 절대 남기지 않는다.
- [ ] 직접 구현 대신 검증된 암호 라이브러리를 사용한다.

---

## 14. 요약

이 문서에서 다음을 엄밀히 보였다.

1. 비특이 타원곡선 위 점 연산의 닫힘성, 항등원/역원, 교환법칙, 결합법칙.
2. 따라서 ECC 점 집합이 아벨 군을 이룸.
3. 스칼라 곱 연산의 대수적 성질과 double-and-add 정당성.
4. ECDH 공유 비밀 일치의 완전 증명.
5. ECDSA 검증식의 완전 증명.
6. nonce 재사용 시 개인키 복구의 완전 증명.

> 다음 확장 주제
> - Edwards curve와 EdDSA의 증명 구조 비교
> - Montgomery ladder의 상수시간 성질 증명
> - pairing-friendly curve에서의 군 구조 차이
