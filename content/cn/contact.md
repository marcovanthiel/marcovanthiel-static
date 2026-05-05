---
type: "contact"
title: "联系方式"
date: 2026-05-04
draft: false
description: "与 Marco van Thiel 联系 — 驻奈梅亨的临时 CIO 与项目集经理。"
---

# 联系方式

有关于项目集管理、临时职位或监督角色的问题？请发送消息 — 我通常会在一个工作日内回复。

<div class="contact-grid">

<div class="contact-details">

## 直接联系

**邮箱**
<a href="mailto:marco@marcovanthiel.nl">marco@marcovanthiel.nl</a>

**电话**
<a href="tel:+31654211659">+31 (0)6 54 211 659</a>

**LinkedIn**
<a href="https://www.linkedin.com/in/marcovanthiel/" target="_blank" rel="noopener noreferrer">linkedin.com/in/marcovanthiel</a>

**位置**
荷兰奈梅亨

</div>

<div class="contact-form-wrap">

## 发送消息

<p class="contact-form-disabled">联系表单暂时不可用。请使用上方地址直接发送邮件 — 我通常会在一个工作日内回复。</p>

<!-- Contactformulier tijdelijk uitgeschakeld — verzending
     werkt nog niet betrouwbaar. Verwijder de comment-tags
     en de <p class="contact-form-disabled"> hierboven om het
     formulier weer te activeren.

<form id="contact-form" class="contact-form" data-lang="cn" novalidate>
  <label>
    <span>姓名</span>
    <input type="text" name="name" autocomplete="name" required maxlength="200">
  </label>
  <label>
    <span>邮箱地址</span>
    <input type="email" name="email" autocomplete="email" required maxlength="320">
  </label>
  <label>
    <span>主题</span>
    <input type="text" name="subject" required maxlength="300">
  </label>
  <label>
    <span>消息</span>
    <textarea name="message" rows="6" required maxlength="10000"></textarea>
  </label>
  <label class="hp-field" aria-hidden="true">
    <span>Website</span>
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </label>
  <button type="submit" class="btn btn-primary">发送消息 →</button>
  <p class="contact-form-note">消息将直接送达我的邮箱。希望自己发邮件？请使用上方的地址。</p>
  <div class="contact-form-status" role="status" aria-live="polite" hidden></div>
</form>

</div>

</div>

<script>
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.contact-form-status');
  var btn = form.querySelector('button[type="submit"]');
  var t = {
    sending: '正在发送…',
    success: '谢谢 — 您的消息已发送。我通常会在一个工作日内回复。',
    error: '出了点问题。请重试或直接发邮件。',
    network: '无连接。请稍后重试。'
  };
  function setStatus(kind, msg) {
    status.hidden = false;
    status.className = 'contact-form-status contact-form-status--' + kind;
    status.textContent = msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var fd = new FormData(form);
    var payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      subject: fd.get('subject'),
      message: fd.get('message'),
      website: fd.get('website') || '',
      lang: form.getAttribute('data-lang') || 'cn'
    };
    btn.disabled = true;
    setStatus('pending', t.sending);
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok && j.ok, body: j }; });
    }).then(function (res) {
      if (res.ok) {
        setStatus('success', t.success);
        form.reset();
      } else {
        setStatus('error', (res.body && res.body.error) || t.error);
        btn.disabled = false;
      }
    }).catch(function () {
      setStatus('error', t.network);
      btn.disabled = false;
    });
  });
})();
</script>
-->

