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

<form id="contact-form" class="contact-form" action="mailto:marco@marcovanthiel.nl" method="post" enctype="text/plain">
  <label>
    <span>姓名</span>
    <input type="text" name="name" autocomplete="name" required>
  </label>
  <label>
    <span>邮箱地址</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label>
    <span>主题</span>
    <input type="text" name="subject" required>
  </label>
  <label>
    <span>消息</span>
    <textarea name="message" rows="6" required></textarea>
  </label>
  <button type="submit" class="btn btn-primary">发送消息 →</button>
  <p class="contact-form-note">表单将打开您的邮件客户端并预填内容；邮件将通过您自己的邮箱发送。希望直接发邮件？请使用上方地址。</p>
</form>

</div>

</div>

<script>
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var subject = encodeURIComponent(String(fd.get('subject') || '来自网站的消息'));
    var body = encodeURIComponent(
      '姓名: ' + (fd.get('name') || '') + '\n' +
      '邮箱: ' + (fd.get('email') || '') + '\n\n' +
      (fd.get('message') || '')
    );
    window.location.href = 'mailto:marco@marcovanthiel.nl?subject=' + subject + '&body=' + body;
  });
})();
</script>
