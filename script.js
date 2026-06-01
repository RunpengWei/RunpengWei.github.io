/*
 * 简历网站交互逻辑
 * 版本切换 + 编辑面板 + 实时预览 + GitHub API 保存
 */
(function() {

  var currentVersion = 'academic';
  var resumeData;
  var editUnlocked = false;
  var EDIT_PASSWORD = '0515';

  // ===== GitHub 配置 =====
  // Token 不存在代码里，首次使用时在浏览器中输入，保存在 localStorage
  var GITHUB_CONFIG = {
    owner: 'RunpengWei',
    repo: 'RunpengWei.github.io'
  };

  function getGithubToken() {
    try { return localStorage.getItem('gh_token') || ''; } catch(e) { return ''; }
  }

  function setGithubToken(token) {
    try { localStorage.setItem('gh_token', token); } catch(e) {}
  }

  // 安全深拷贝
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // 初始化
  function init() {
    if (typeof RESUME_CONFIG === 'undefined') {
      document.getElementById('displayName').textContent = '配置加载失败，请检查 config.js';
      return;
    }

    resumeData = deepCopy(RESUME_CONFIG);
    loadSavedData();
    renderResume();
    populateEditPanel();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 事件绑定
  function bindEvents() {
    // 编辑面板开关（需要密码验证）
    document.getElementById('editToggle').onclick = function() {
      if (!editUnlocked) {
        var pwd = prompt('请输入编辑密码：');
        if (pwd === EDIT_PASSWORD) {
          editUnlocked = true;
          toggleEditPanel();
          showToast('验证成功，已解锁编辑');
        } else if (pwd !== null) {
          showToast('密码错误');
        }
      } else {
        toggleEditPanel();
      }
    };
    document.getElementById('panelClose').onclick = function() {
      closeEditPanel();
    };

    // 版本切换
    document.getElementById('btnAcademic').onclick = function() {
      switchVersion('academic');
    };
    document.getElementById('btnEducation').onclick = function() {
      switchVersion('education');
    };
    document.getElementById('btnCorporate').onclick = function() {
      switchVersion('corporate');
    };

    // 实时编辑
    document.getElementById('editName').oninput = liveUpdate;
    document.getElementById('editTagline').oninput = liveUpdate;
    document.getElementById('editBio').oninput = liveUpdate;
    document.getElementById('editPhone').oninput = liveUpdate;
    document.getElementById('editEmail').oninput = liveUpdate;
    document.getElementById('editSkills').oninput = liveUpdate;

    // 保存和重置
    document.getElementById('saveBtn').onclick = function() { saveData(); };
    document.getElementById('resetBtn').onclick = function() { resetData(); };

    // 添加教育
    document.getElementById('addEducation').onclick = function() { addEducationEntry(); };
  }

  // 版本切换
  function switchVersion(version) {
    currentVersion = version;
    var btns = document.querySelectorAll('.version-btn');
    for (var i = 0; i < btns.length; i++) {
      var v = btns[i].getAttribute('data-version');
      btns[i].className = (v === version) ? 'version-btn active' : 'version-btn';
    }
    document.body.className = '';
    if (version === 'education') document.body.className = 'theme-education';
    if (version === 'corporate') document.body.className = 'theme-corporate';
    renderResume();
    populateEditPanel();
  }

  // 渲染简历内容
  function renderResume() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];

    document.getElementById('displayName').textContent = shared.name;
    document.getElementById('displayTagline').textContent = ver.tagline;
    document.getElementById('displayBio').textContent = ver.bio;
    document.getElementById('navName').textContent = shared.name;

    var contactHtml = '<span class="contact-item">Tel: ' + shared.phone + '</span>';
    contactHtml += '<span class="contact-item">Email: ' + shared.email + '</span>';
    document.getElementById('displayContact').innerHTML = contactHtml;

    var eduHtml = '';
    for (var i = 0; i < shared.education.length; i++) {
      var edu = shared.education[i];
      eduHtml += '<div class="edu-item"><div class="edu-header"><div>';
      eduHtml += '<div class="edu-school">' + edu.school + ' · ' + edu.degree + '</div>';
      eduHtml += '<div class="edu-major">' + edu.major + '</div>';
      eduHtml += '</div><span class="edu-time">' + edu.time + '</span></div>';
      eduHtml += '<ul class="edu-details">';
      for (var j = 0; j < edu.details.length; j++) {
        eduHtml += '<li>' + edu.details[j] + '</li>';
      }
      eduHtml += '</ul></div>';
    }
    document.getElementById('displayEducation').innerHTML = eduHtml;

    var honorsHtml = '';
    for (var i = 0; i < shared.honors.length; i++) {
      honorsHtml += '<div class="honor-item">' + shared.honors[i] + '</div>';
    }
    document.getElementById('displayHonors').innerHTML = honorsHtml;

    var secHtml = '';
    for (var s = 0; s < ver.sections.length; s++) {
      var sec = ver.sections[s];
      secHtml += '<section class="resume-section">';
      secHtml += '<h2 class="section-title"><span class="section-icon">' + sec.icon + '</span> ' + sec.title + '</h2>';
      secHtml += '<div class="section-content">';
      for (var k = 0; k < sec.items.length; k++) {
        var item = sec.items[k];
        secHtml += '<div class="exp-item"><div class="exp-header">';
        secHtml += '<span class="exp-role">' + item.role + '</span>';
        if (item.time) secHtml += '<span class="exp-time">' + item.time + '</span>';
        secHtml += '</div>';
        if (item.org) secHtml += '<div class="exp-org">' + item.org + '</div>';
        secHtml += '<ul class="exp-details">';
        for (var d = 0; d < item.details.length; d++) {
          secHtml += '<li>' + item.details[d] + '</li>';
        }
        secHtml += '</ul></div>';
      }
      secHtml += '</div></section>';
    }
    document.getElementById('dynamicSections').innerHTML = secHtml;

    var skillHtml = '';
    for (var i = 0; i < shared.skills.length; i++) {
      skillHtml += '<span class="skill-tag">' + shared.skills[i] + '</span>';
    }
    document.getElementById('displaySkills').innerHTML = skillHtml;
  }

  // 填充编辑面板
  function populateEditPanel() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];
    document.getElementById('editName').value = shared.name;
    document.getElementById('editTagline').value = ver.tagline;
    document.getElementById('editBio').value = ver.bio;
    document.getElementById('editPhone').value = shared.phone;
    document.getElementById('editEmail').value = shared.email;
    document.getElementById('editSkills').value = shared.skills.join(', ');
    renderEducationInputs();
  }

  function renderEducationInputs() {
    var container = document.getElementById('editEducation');
    container.innerHTML = '';
    for (var i = 0; i < resumeData.shared.education.length; i++) {
      var edu = resumeData.shared.education[i];
      var div = document.createElement('div');
      div.className = 'edu-input-group';

      var inp1 = document.createElement('input');
      inp1.type = 'text'; inp1.value = edu.school;
      inp1.placeholder = '学校';
      inp1.setAttribute('data-idx', i); inp1.setAttribute('data-field', 'school');
      inp1.oninput = eduInputChange;

      var inp2 = document.createElement('input');
      inp2.type = 'text'; inp2.value = edu.major;
      inp2.placeholder = '专业';
      inp2.setAttribute('data-idx', i); inp2.setAttribute('data-field', 'major');
      inp2.oninput = eduInputChange;

      var inp3 = document.createElement('input');
      inp3.type = 'text'; inp3.value = edu.time;
      inp3.placeholder = '时间段';
      inp3.setAttribute('data-idx', i); inp3.setAttribute('data-field', 'time');
      inp3.oninput = eduInputChange;

      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'remove-edu-btn';
      btn.textContent = '删除'; btn.setAttribute('data-idx', i);
      btn.onclick = removeEdu;

      div.appendChild(inp1); div.appendChild(inp2);
      div.appendChild(inp3); div.appendChild(btn);
      container.appendChild(div);
    }
  }

  function eduInputChange(e) {
    var idx = parseInt(e.target.getAttribute('data-idx'));
    var field = e.target.getAttribute('data-field');
    resumeData.shared.education[idx][field] = e.target.value;
    renderResume();
  }

  function removeEdu(e) {
    var idx = parseInt(e.target.getAttribute('data-idx'));
    resumeData.shared.education.splice(idx, 1);
    renderEducationInputs();
    renderResume();
  }

  function addEducationEntry() {
    resumeData.shared.education.push({
      school: '', degree: '', major: '', time: '', details: []
    });
    renderEducationInputs();
  }

  // 实时更新
  function liveUpdate() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];
    shared.name = document.getElementById('editName').value;
    ver.tagline = document.getElementById('editTagline').value;
    ver.bio = document.getElementById('editBio').value;
    shared.phone = document.getElementById('editPhone').value;
    shared.email = document.getElementById('editEmail').value;

    var skillStr = document.getElementById('editSkills').value;
    var arr = skillStr.split(/[,，]/);
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i].replace(/^\s+|\s+$/g, '');
      if (s.length > 0) result.push(s);
    }
    shared.skills = result;
    renderResume();
  }

  // 面板控制
  function toggleEditPanel() {
    var panel = document.getElementById('editPanel');
    var btn = document.getElementById('editToggle');
    if (panel.className.indexOf('visible') >= 0) {
      panel.className = 'edit-panel';
      btn.className = 'edit-toggle-btn';
    } else {
      panel.className = 'edit-panel visible';
      btn.className = 'edit-toggle-btn active';
    }
  }

  function closeEditPanel() {
    document.getElementById('editPanel').className = 'edit-panel';
    document.getElementById('editToggle').className = 'edit-toggle-btn';
  }

  // ===== 保存逻辑（GitHub API） =====
  function saveData() {
    // 先保存到 localStorage 作为即时备份
    try {
      localStorage.setItem('resume_data_v3', JSON.stringify(resumeData));
      localStorage.setItem('resume_version_v3', currentVersion);
    } catch(e) {}

    // 检查 GitHub Token
    var token = getGithubToken();
    if (!token) {
      token = prompt('首次同步，请输入你的 GitHub Token（ghp_开头）：');
      if (!token || token.indexOf('ghp_') !== 0) {
        showToast('已保存到本地。输入有效Token后可云端同步。');
        return;
      }
      setGithubToken(token);
    }

    // 推送到 GitHub
    showToast('正在同步到 GitHub...');
    pushToGitHub();
  }

  function pushToGitHub() {
    var fileContent = generateConfigFileContent();
    var path = 'config.js';
    var token = getGithubToken();
    var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + path;

    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', url, true);
    xhr1.setRequestHeader('Authorization', 'token ' + token);
    xhr1.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr1.onload = function() {
      var sha = '';
      if (xhr1.status === 200) {
        var resp = JSON.parse(xhr1.responseText);
        sha = resp.sha;
      }
      // 第二步：提交更新
      commitFile(url, fileContent, sha);
    };
    xhr1.onerror = function() {
      showToast('网络错误，请检查网络连接');
    };
    xhr1.send();
  }

  function commitFile(url, content, sha) {
    var body = {
      message: '更新简历内容 [' + new Date().toLocaleString('zh-CN') + ']',
      content: utf8ToBase64(content)
    };
    if (sha) {
      body.sha = sha;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Authorization', 'token ' + getGithubToken());
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 201) {
        showToast('已同步到 GitHub！网站将在1-2分钟内更新。');
      } else {
        var errMsg = '同步失败';
        try {
          var resp = JSON.parse(xhr.responseText);
          errMsg += '：' + (resp.message || '未知错误');
        } catch(e) {}
        showToast(errMsg);
      }
    };
    xhr.onerror = function() {
      showToast('网络错误，同步失败');
    };
    xhr.send(JSON.stringify(body));
  }

  // 生成 config.js 文件内容
  function generateConfigFileContent() {
    var lines = [];
    lines.push('/*');
    lines.push(' * 简历配置文件 - 所有内容都在这里修改');
    lines.push(' * 修改后保存，刷新浏览器即可看到变化');
    lines.push(' */');
    lines.push('var RESUME_CONFIG = ' + JSON.stringify(resumeData, null, 2) + ';');
    return lines.join('\n');
  }

  // UTF-8 字符串转 Base64（支持中文）
  function utf8ToBase64(str) {
    var encoder = new TextEncoder();
    var bytes = encoder.encode(str);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function loadSavedData() {
    try {
      var saved = localStorage.getItem('resume_data_v3');
      var ver = localStorage.getItem('resume_version_v3');
      if (saved) {
        resumeData = JSON.parse(saved);
      }
      if (ver) {
        currentVersion = ver;
        if (ver === 'education') document.body.className = 'theme-education';
        if (ver === 'corporate') document.body.className = 'theme-corporate';
        var btns = document.querySelectorAll('.version-btn');
        for (var i = 0; i < btns.length; i++) {
          var v = btns[i].getAttribute('data-version');
          btns[i].className = (v === currentVersion) ? 'version-btn active' : 'version-btn';
        }
      }
    } catch(e) {}
  }

  function resetData() {
    if (!confirm('确定重置所有修改？将恢复为线上版本。')) return;
    resumeData = deepCopy(RESUME_CONFIG);
    try {
      localStorage.removeItem('resume_data_v3');
      localStorage.removeItem('resume_version_v3');
    } catch(e) {}
    renderResume();
    populateEditPanel();
    showToast('已重置');
  }

  // Toast
  function showToast(msg) {
    // 移除旧的 toast
    var old = document.querySelector('.toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s';
      setTimeout(function() {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 300);
    }, 3000);
  }

})();
