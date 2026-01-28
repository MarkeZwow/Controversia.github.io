const SUPABASE_URL = 'https://noawhiwgihrcqygsmjed.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXdoaXdnaWhyY3F5Z3NtamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTkzMzUsImV4cCI6MjA4NDc3NTMzNX0.MPeLwmSh5Vx12J470W_tbojh5JoUJIhSa0V-Q_a20ow';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Завантаження тем (Topic)
async function loadContent() {
    const container = document.getElementById('main-container');
    container.innerHTML = '<p style="text-align:center;">Завантаження дискусій...</p>';

    const { data: topics, error } = await supabaseClient
        .from('topics')
        .select('*')
        .eq('status', 'active')
        .order('id', { ascending: true });

    if (error) {
        container.innerHTML = '<p style="color:red;">Помилка підключення до бази.</p>';
        return;
    }

    container.innerHTML = ''; 

    for (const topic of topics) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="topic-header">
                <small style="color: var(--accent);">ТЕМА #${topic.id}</small>
                <h2>${topic.title}</h2>
                <p style="color: var(--text-muted);">${topic.description}</p>
            </div>
            <div class="debate-grid" id="grid-${topic.id}"></div>
            <button class="btn-action" onclick="addIdea(${topic.id})">
                + Додати свою думку
            </button>
        `;
        container.appendChild(div);
        await loadArguments(topic.id);
    }
}

// 2. Завантаження аргументів
async function loadArguments(topicId) {
    const { data: args, error } = await supabaseClient
        .from('arguments')
        .select('*')
        .eq('topic_id', topicId)
        .order('reputation', { ascending: false });

    const grid = document.getElementById(`grid-${topicId}`);
    if (!grid) return;

    grid.innerHTML = '';
    if (args) {
        args.forEach(arg => {
            const isContra = (arg.arg_type === 'contra' || arg.arg_type === 'con');
            const typeClass = isContra ? 'contra' : 'pro';
            const badgeLabel = isContra ? 'Заперечення' : 'Підтримка';

            grid.innerHTML += `
                <div class="argument-card ${typeClass}">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-${typeClass}">${arg.badge_text || 'Користувач'}</span>
                        <span style="cursor:pointer;" onclick="voteArgument(${arg.id}, ${topicId})">
                            👍 <b>${arg.reputation}</b>
                        </span>
                    </div>
                    <h4 style="margin:5px 0; color:var(--accent);">${arg.title || 'Думка'}</h4>
                    <p style="font-size:0.9rem;">${arg.content}</p>
                    <small style="color:var(--text-muted);">— ${arg.author_name || 'Гість'}</small>
                </div>
            `;
        });
    }
}

// 3. Додавання ідеї (АВТОМАТИЧНІ ПОЛЯ)
async function addIdea(topicId) {
    // Користувач вводить лише суть
    const text = prompt("Ваша ідея або аргумент:");
    if (!text) return;

    const typeInput = prompt("Тип: 'pro' (підтримую) або 'contra' (заперечую):", "pro");
    const safeType = (typeInput === 'contra' || typeInput === 'con') ? 'contra' : 'pro';

    // Всі інші дані заповнюються автоматично
    const { error } = await supabaseClient
        .from('arguments')
        .insert([{ 
            topic_id: topicId, 
            content: text, 
            arg_type: safeType,
            title: "Думка",            // Автозаповнення
            badge_text: "Користувач",   // Автозаповнення
            author_name: "Гість"        // Автозаповнення
        }]);

    if (error) {
        alert("Помилка: " + error.message);
    } else {
        loadArguments(topicId);
    }
}

// 4. Голосування
async function voteArgument(argId, topicId) {
    const { error } = await supabaseClient.rpc('vote_for_argument', { arg_id: argId });
    if (error) {
        console.error(error);
    } else {
        loadArguments(topicId);
    }
}
loadContent();
