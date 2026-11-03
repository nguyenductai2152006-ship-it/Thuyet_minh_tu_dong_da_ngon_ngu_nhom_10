package com.sgu.identity.bootstrap;
import com.sgu.identity.dto.AuthDto.RegisterRequest;
import com.sgu.identity.entity.User;
import com.sgu.identity.repository.UserRepository;
import jakarta.validation.Validator;
import org.springframework.boot.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
@Component @Profile("bootstrap")
public class BootstrapAdmin implements ApplicationRunner {
 private final UserRepository users;private final PasswordEncoder encoder;private final Validator validator;private final Environment env;private final ConfigurableApplicationContext context;
 public BootstrapAdmin(UserRepository users,PasswordEncoder encoder,Validator validator,Environment env,ConfigurableApplicationContext context){this.users=users;this.encoder=encoder;this.validator=validator;this.env=env;this.context=context;}
 @Override public void run(ApplicationArguments args){
  String email=env.getRequiredProperty("BOOTSTRAP_ADMIN_EMAIL").trim().toLowerCase(java.util.Locale.ROOT), password=env.getRequiredProperty("BOOTSTRAP_ADMIN_PASSWORD");
  if(!validator.validate(new RegisterRequest(email,password,"Quản trị viên")).isEmpty())throw new IllegalArgumentException("Invalid email or password (8-72 characters, at most 72 UTF-8 bytes)");
  if(users.existsByEmail(email))throw new IllegalStateException("Account exists; bootstrap never resets or promotes an account");
  users.saveAndFlush(new User(null,email,"Quản trị viên",encoder.encode(password),"ADMIN"));
  SpringApplication.exit(context,()->0);
 }
}
