<?php
/** Closing scripts. @var array $page */
declare(strict_types=1);
?>
<script src="/assets/site.js"></script>
<?php foreach (($page['scripts'] ?? []) as $src): ?>
<script src="<?= attr($src) ?>"></script>
<?php endforeach; ?>
